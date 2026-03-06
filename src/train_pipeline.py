import sys
import os
import time
import json
import optuna
import joblib
import pandas as pd
import numpy as np
from collections import Counter
from pathlib import Path

from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import f1_score
from imblearn.over_sampling import SMOTE

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.config import settings
from src.logger import setup_logger
from src.data.loader import load_historical_data
from src.data.preprocessor import preprocess_training_data, save_encoders
from src.features.engineering import engineer_features, compute_behavioral_stats, get_feature_columns
from src.models.xgboost_model import XGBoostRiskModel
from src.models.lgbm_model import LightGBMRiskModel
from src.models.anomaly import AnomalyDetector

logger = setup_logger("src.train_pipeline")
optuna.logging.set_verbosity(optuna.logging.WARNING)

def optimize_xgboost(X_train, y_train, sample_weights):
    def objective(trial):
        params = dict(
            n_estimators     = trial.suggest_int("n_estimators", 200, 500),
            max_depth        = trial.suggest_int("max_depth", 3, 8),
            learning_rate    = trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            subsample        = trial.suggest_float("subsample", 0.6, 1.0),
            colsample_bytree = trial.suggest_float("colsample_bytree", 0.6, 1.0),
            min_child_weight = trial.suggest_int("min_child_weight", 1, 10),
            objective        = "multi:softprob",
            num_class        = 3,
            eval_metric      = "mlogloss",
            random_state     = 42,
            n_jobs           = -1,
        )
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = []
        for trn_idx, val_idx in skf.split(X_train, y_train):
            X_tr, X_val = X_train[trn_idx], X_train[val_idx]
            y_tr, y_val = y_train.iloc[trn_idx], y_train.iloc[val_idx]
            sw_tr = sample_weights[trn_idx]
            
            import xgboost as xgb
            m = xgb.XGBClassifier(**params)
            m.fit(X_tr, y_tr, sample_weight=sw_tr, verbose=False)
            val_pred = np.argmax(m.predict_proba(X_val), axis=1)
            scores.append(f1_score(y_val, val_pred, average="macro", zero_division=0))
        return np.mean(scores)

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(objective, n_trials=10, show_progress_bar=False)
    
    best_params = study.best_params
    best_params.update({
        "objective": "multi:softprob",
        "num_class": 3,
        "eval_metric": "mlogloss",
        "random_state": 42,
        "n_jobs": -1,
    })
    return best_params

def optimize_lgbm(X_train, y_train):
    def objective(trial):
        params = dict(
            n_estimators     = trial.suggest_int("n_estimators", 200, 500),
            max_depth        = trial.suggest_int("max_depth", 3, 8),
            learning_rate    = trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
            num_leaves       = trial.suggest_int("num_leaves", 20, 100),
            subsample        = trial.suggest_float("subsample", 0.6, 1.0),
            colsample_bytree = trial.suggest_float("colsample_bytree", 0.6, 1.0),
            min_child_samples= trial.suggest_int("min_child_samples", 10, 50),
            objective        = "multiclass",
            num_class        = 3,
            metric           = "multi_logloss",
            is_unbalance     = True,
            random_state     = 42,
            verbose          = -1,
        )
        skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = []
        for trn_idx, val_idx in skf.split(X_train, y_train):
            X_tr, X_val = X_train[trn_idx], X_train[val_idx]
            y_tr, y_val = y_train.iloc[trn_idx], y_train.iloc[val_idx]
            
            import lightgbm as lgb
            m = lgb.LGBMClassifier(**params)
            m.fit(X_tr, y_tr)
            val_pred = np.argmax(m.predict_proba(X_val), axis=1)
            scores.append(f1_score(y_val, val_pred, average="macro", zero_division=0))
        return np.mean(scores)

    study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
    study.optimize(objective, n_trials=10, show_progress_bar=False)
    
    best_params = study.best_params
    best_params.update({
        "objective": "multiclass",
        "num_class": 3,
        "metric": "multi_logloss",
        "is_unbalance": True,
        "random_state": 42,
        "verbose": -1,
    })
    return best_params

def main():
    logger.info("=" * 60)
    logger.info("SmartContainer Risk Engine — V3 Leak-Prevention Training Pipeline")
    logger.info("=" * 60)
    
    # ---- 1. Load Data & Split ----
    df = load_historical_data()
    train_df, test_df = train_test_split(
        df, test_size=0.30, stratify=df["target"], random_state=42
    )
    logger.info(f"Loaded {len(df)} historical records. Split to {len(train_df)} train, {len(test_df)} test.")

    # ---- 2. Preprocessing & Leak Prevention ----
    # Fit encoders only on the train set (Leak prevention)
    logger.info("Fitting Encoders on Train Split ONLY...")
    train_df, encoders = preprocess_training_data(train_df)
    save_encoders(encoders)
    
    # ---- 3. Feature Engineering ----
    logger.info("Engineering Features...")
    train_df = engineer_features(train_df)
    behavioral_stats = compute_behavioral_stats(train_df)
    settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(behavioral_stats, settings.MODELS_DIR / "behavioral_stats.joblib")
    
    feature_columns = get_feature_columns(train_df)
    joblib.dump(feature_columns, settings.MODELS_DIR / "feature_columns.joblib")
    logger.info(f"Features: {len(feature_columns)}")
    
    X_train_raw = train_df[feature_columns].values
    y_train_raw = train_df["target"].values
    
    # ---- 4. SMOTE Oversampling ----
    logger.info("Running SMOTE Oversampling...")
    n_critical = (y_train_raw == 2).sum()
    n_target = max(int(len(y_train_raw) * 0.05), n_critical)
    
    if n_target > n_critical:
        # Avoid issues when dataset is very small
        k_neighbors = min(5, n_critical - 1)
        if k_neighbors > 0:
            smote = SMOTE(
                sampling_strategy={2: n_target},
                random_state=42,
                k_neighbors=k_neighbors
            )
            X_tr_sm, y_tr_sm = smote.fit_resample(X_train_raw, y_train_raw)
        else:
            X_tr_sm, y_tr_sm = X_train_raw, y_train_raw
    else:
        X_tr_sm, y_tr_sm = X_train_raw, y_train_raw
    
    # class weights
    class_counts = Counter(y_tr_sm)
    total = len(y_tr_sm)
    sample_weights = np.array([total / (len(class_counts) * class_counts[y]) for y in y_tr_sm])
    
    # ---- 5. Optuna Tuning ----
    logger.info("Optimizing XGBoost with Optuna (5-Fold CV)...")
    xgb_params = optimize_xgboost(X_tr_sm, pd.Series(y_tr_sm), sample_weights)
    logger.info(f"Best XGBoost Params: {xgb_params}")
    
    logger.info("Optimizing LightGBM with Optuna (5-Fold CV)...")
    lgbm_params = optimize_lgbm(X_tr_sm, pd.Series(y_tr_sm))
    logger.info(f"Best LightGBM Params: {lgbm_params}")
    
    # ---- 6. Train Models on Full Data ----
    # Preprocess FULL dataset to use all available knowledge in final models
    logger.info("Retraining final models on full historical data...")
    df, _ = preprocess_training_data(df)
    df = engineer_features(df)
    X_full = df[feature_columns].values
    y_full = df["target"].values
    
    # Apply SMOTE on the full set
    n_crit_full = (y_full == 2).sum()
    n_target_full = max(int(len(y_full) * 0.05), n_crit_full)
    k_neighbors_full = min(5, n_crit_full - 1)
    if k_neighbors_full > 0 and n_target_full > n_crit_full:
        smote_full = SMOTE(
            sampling_strategy={2: n_target_full},
            random_state=42,
            k_neighbors=k_neighbors_full
        )
        X_full_sm, y_full_sm = smote_full.fit_resample(X_full, y_full)
    else:
        X_full_sm, y_full_sm = X_full, y_full
    
    class_counts_full = Counter(y_full_sm)
    total_full = len(y_full_sm)
    sample_weights_full = np.array([total_full / (len(class_counts_full) * class_counts_full[y]) for y in y_full_sm])
    
    import xgboost as xgb
    xgb_model = XGBoostRiskModel()
    xgb_model.best_params = xgb_params
    xgb_model.model = xgb.XGBClassifier(**xgb_params)
    xgb_model.model.fit(X_full_sm, y_full_sm, sample_weight=sample_weights_full)
    xgb_model.feature_columns = feature_columns
    xgb_model.save()
    logger.info("XGBoost trained and saved.")
    
    import lightgbm as lgb
    lgbm_model = LightGBMRiskModel()
    lgbm_model.best_params = lgbm_params
    lgbm_model.model = lgb.LGBMClassifier(**lgbm_params)
    lgbm_model.model.fit(X_full_sm, y_full_sm)
    lgbm_model.feature_columns = feature_columns
    lgbm_model.save()
    logger.info("LightGBM trained and saved.")
    
    # Anomaly detector
    logger.info("Training Anomaly Detector on full features...")
    anomaly_detector = AnomalyDetector()
    anomaly_detector.fit(df)
    anomaly_detector.save()
    logger.info("Anomaly Detector saved.")
    logger.info("=" * 60)
    logger.info("V3 Pipeline Complete.")

if __name__ == "__main__":
    main()
