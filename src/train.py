"""
Training Script
Full training pipeline: Load → Preprocess → Engineer Features → Train Models → Save
"""

import sys
import os
import json
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data.loader import load_historical_data
from src.data.preprocessor import preprocess_training_data, save_encoders
from src.features.engineering import engineer_features, compute_behavioral_stats, get_feature_columns
from src.models.xgboost_model import XGBoostRiskModel
from src.models.lgbm_model import LightGBMRiskModel
from src.models.anomaly import AnomalyDetector
import joblib

from src.config import settings
from src.logger import setup_logger

logger = setup_logger("src.train")


def main():
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("SmartContainer Risk Engine — Training Pipeline")
    logger.info("=" * 60)
    
    # ---- Step 1: Load Data ----
    logger.info("📥 Step 1: Loading Historical Data...")
    df = load_historical_data()
    
    # ---- Step 2: Preprocess ----
    logger.info("🔧 Step 2: Preprocessing...")
    df, encoders = preprocess_training_data(df)
    save_encoders(encoders)
    
    # ---- Step 3: Feature Engineering ----
    logger.info("⚙️ Step 3: Engineering Features...")
    df = engineer_features(df)
    
    # Compute and save behavioral stats for inference
    behavioral_stats = compute_behavioral_stats(df)
    settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(behavioral_stats, settings.MODELS_DIR / "behavioral_stats.joblib")
    logger.info(f"[Train] Behavioral stats saved")
    
    # ---- Step 4: Get Feature Columns ----
    feature_columns = get_feature_columns(df)
    logger.info(f"📋 Feature columns ({len(feature_columns)}): {feature_columns[:10]}...")
    
    # Save feature columns list
    joblib.dump(feature_columns, settings.MODELS_DIR / "feature_columns.joblib")
    
    y = df["target"]
    
    # ---- Step 5: Train XGBoost ----
    logger.info("🌲 Step 5: Training XGBoost...")
    xgb_model = XGBoostRiskModel()
    xgb_model.train(df, y, feature_columns)
    xgb_model.save()
    
    # ---- Step 6: Train LightGBM ----
    logger.info("💡 Step 6: Training LightGBM...")
    lgbm_model = LightGBMRiskModel()
    lgbm_model.train(df, y, feature_columns)
    lgbm_model.save()
    
    # ---- Step 7: Train Anomaly Detector ----
    logger.info("🔍 Step 7: Training Anomaly Detector...")
    anomaly_detector = AnomalyDetector()
    anomaly_detector.fit(df)
    anomaly_detector.save()
    
    # ---- Summary ----
    elapsed = time.time() - start_time
    logger.info("=" * 60)
    logger.info(f"✅ Training Complete in {elapsed:.1f}s")
    logger.info(f"   Models saved to {settings.MODELS_DIR}/")
    logger.info(f"   Features: {len(feature_columns)}")
    logger.info(f"   Training samples: {len(df)}")
    
    # Save training metadata
    metadata = {
        "training_samples": len(df),
        "feature_count": len(feature_columns),
        "feature_columns": feature_columns,
        "class_distribution": {
            "Clear": int((y == 0).sum()),
            "Low Risk": int((y == 1).sum()),
            "Critical": int((y == 2).sum()),
        },
        "training_time_seconds": round(elapsed, 1),
    }
    
    with open(settings.MODELS_DIR / "training_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
