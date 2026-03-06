"""
Inference Pipeline
Full pipeline: Load Real-Time Data → Features → Predict → Explain → Output CSV + JSON
"""

import sys
import os
import json
import time
import datetime
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
import joblib

from src.config import settings
from src.logger import setup_logger

logger = setup_logger("src.pipeline")

from src.data.loader import load_realtime_data
from src.data.preprocessor import preprocess_inference_data, load_encoders
from src.features.engineering import engineer_features, get_feature_columns
from src.models.xgboost_model import XGBoostRiskModel
from src.models.lgbm_model import LightGBMRiskModel
from src.models.anomaly import AnomalyDetector
from src.models.ensemble import EnsembleRiskScorer
from src.explainability.shap_explainer import ShapExplainer
from src.explainability.rule_explainer import generate_explanations


def run_inference(data_path: str = None, output_dir: str = "output"):
    """Run full inference pipeline on real-time data."""
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("SmartContainer Risk Engine — Inference Pipeline")
    logger.info("=" * 60)
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # ---- Step 1: Load Data ----
    logger.info("📥 Step 1: Loading Data...")
    if data_path:
        df_raw = pd.read_csv(data_path)
        from src.data.loader import _normalize_dates, _validate_schema
        df_raw = _normalize_dates(df_raw)
        df_raw = _validate_schema(df_raw)
    else:
        df_raw = load_realtime_data()
    
    container_ids = df_raw["Container_ID"].copy()
    
    # ---- Step 2: Preprocess ----
    logger.info("🔧 Step 2: Preprocessing...")
    encoders = load_encoders()
    df = preprocess_inference_data(df_raw, encoders)
    
    # ---- Step 3: Feature Engineering ----
    logger.info("⚙️ Step 3: Engineering Features...")
    behavioral_stats = joblib.load(settings.MODELS_DIR / "behavioral_stats.joblib")
    df = engineer_features(df, historical_stats=behavioral_stats)
    
    # ---- Step 4: Load Models ----
    logger.info("📦 Step 4: Loading Models...")
    feature_columns = joblib.load(settings.MODELS_DIR / "feature_columns.joblib")
    
    # Ensure all feature columns exist (fill missing with 0)
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    
    xgb_model = XGBoostRiskModel()
    xgb_model.load()
    
    lgbm_model = LightGBMRiskModel()
    lgbm_model.load()
    
    anomaly_detector = AnomalyDetector()
    anomaly_detector.load()
    
    # ---- Step 5: Predict ----
    logger.info("🎯 Step 5: Generating Predictions...")
    xgb_proba = xgb_model.predict_proba(df)
    lgbm_proba = lgbm_model.predict_proba(df)
    anomaly_scores = anomaly_detector.compute_anomaly_score(df)
    anomaly_flags = anomaly_detector.get_anomaly_flags(df)
    
    # Ensemble
    ensemble = EnsembleRiskScorer()
    results = ensemble.compute_risk_scores(xgb_proba, lgbm_proba, anomaly_scores)
    
    # ---- Step 6: Explainability ----
    logger.info("💡 Step 6: Generating Explanations...")
    # SHAP explanations (using XGBoost model)
    shap_explainer = ShapExplainer()
    shap_results = shap_explainer.explain(xgb_model.model, df, feature_columns)
    
    # Generate natural language explanations
    explanations = generate_explanations(
        df, results["Risk_Score"], results["Risk_Level"],
        shap_top_features=shap_results["top_features"],
        anomaly_flags=anomaly_flags,
    )
    
    # ---- Step 7: Output ----
    logger.info("📤 Step 7: Generating Output Files...")
    
    # Prediction CSV (required output format)
    output_csv = pd.DataFrame({
        "Container_ID": container_ids.values,
        "Risk_Score": results["Risk_Score"].values,
        "Risk_Level": results["Risk_Level"].values,
        "Explanation_Summary": explanations,
    })
    csv_path = os.path.join(output_dir, "predictions.csv")
    output_csv.to_csv(csv_path, index=False)
    logger.info(f"   ✅ Predictions CSV: {csv_path}")
    
    # Detailed JSON for dashboard
    dashboard_data = {
        "summary": ensemble.get_risk_summary(results),
        "predictions": [],
        "feature_importance": shap_explainer.get_global_feature_importance(),
        "anomaly_distribution": {
            "weight_anomaly": int(anomaly_flags["weight_anomaly"].sum()),
            "value_anomaly": int(anomaly_flags["value_anomaly"].sum()),
            "dwell_anomaly": int(anomaly_flags["dwell_anomaly"].sum()),
            "night_anomaly": int(anomaly_flags["night_anomaly"].sum()),
            "overweight": int(anomaly_flags["overweight"].sum()),
            "underweight": int(anomaly_flags["underweight"].sum()),
        },
    }
    
    # Container details for dashboard
    for i in range(len(output_csv)):
        container = {
            "container_id": str(container_ids.iloc[i]),
            "risk_score": float(results["Risk_Score"].iloc[i]),
            "risk_level": results["Risk_Level"].iloc[i],
            "explanation": explanations[i],
            "xgb_risk": float(results["XGB_Risk"].iloc[i]),
            "lgbm_risk": float(results["LGBM_Risk"].iloc[i]),
            "anomaly_risk": float(results["Anomaly_Risk"].iloc[i]),
            "anomaly_score": float(anomaly_scores.iloc[i]),
            "origin_country": str(df_raw["Origin_Country"].iloc[i]),
            "destination_country": str(df_raw["Destination_Country"].iloc[i]),
            "destination_port": str(df_raw["Destination_Port"].iloc[i]),
            "hs_code": str(df_raw["HS_Code"].iloc[i]),
            "declared_value": float(df_raw["Declared_Value"].iloc[i]),
            "declared_weight": float(df_raw["Declared_Weight"].iloc[i]),
            "measured_weight": float(df_raw["Measured_Weight"].iloc[i]),
            "dwell_time_hours": float(df_raw["Dwell_Time_Hours"].iloc[i]) if pd.notnull(df_raw["Dwell_Time_Hours"].iloc[i]) else 0.0,
            "shipping_line": str(df_raw["Shipping_Line"].iloc[i]),
            "trade_regime": str(df_raw["Trade_Regime (Import / Export / Transit)"].iloc[i]),
            "importer_id": str(df_raw["Importer_ID"].iloc[i]),
            "exporter_id": str(df_raw["Exporter_ID"].iloc[i]),
            "declaration_date": str(df_raw["Declaration_Date (YYYY-MM-DD)"].iloc[i]),
            "declaration_time": str(df_raw["Declaration_Time"].iloc[i]),
        }
        
        # Add SHAP top features
        if i < len(shap_results["top_features"]):
            container["top_risk_factors"] = shap_results["top_features"][i]
        
        # Add anomaly flags
        container["anomaly_flags"] = {
            k: bool(v) for k, v in anomaly_flags.iloc[i].items()
        }
        
        dashboard_data["predictions"].append(container)
    
    # ---- Risk Distribution for Charts ----
    risk_bins = pd.cut(results["Risk_Score"], bins=[0, 20, 40, 60, 80, 100], labels=["0-20", "20-40", "40-60", "60-80", "80-100"])
    dashboard_data["risk_distribution"] = risk_bins.value_counts().sort_index().to_dict()
    
    # Origin country risk aggregation
    country_risk = pd.DataFrame({
        "origin_country": df_raw["Origin_Country"],
        "risk_score": results["Risk_Score"],
    })
    dashboard_data["country_risk"] = country_risk.groupby("origin_country")["risk_score"].agg(["mean", "count"]).round(2).reset_index().to_dict(orient="records")
    
    # Top critical containers
    critical_mask = results["Risk_Level"] == "Critical"
    dashboard_data["summary"]["top_critical_containers"] = output_csv[critical_mask].nlargest(20, "Risk_Score").to_dict(orient="records")
    
    # Convert to JSON with NaN handling
    def json_serialize(obj):
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj) if np.isfinite(obj) else 0.0
        if isinstance(obj, (pd.Timestamp, datetime.date)):
            return obj.isoformat()
        return str(obj)

    json_path = os.path.join(output_dir, "dashboard_data.json")
    with open(json_path, "w") as f:
        json.dump(dashboard_data, f, indent=2, default=json_serialize)
    logger.info(f"   ✅ Dashboard JSON: {json_path}")
    
    # ---- Summary ----
    elapsed = time.time() - start_time
    summary = ensemble.get_risk_summary(results)
    logger.info(f"{'=' * 60}")
    logger.info(f"✅ Inference Complete in {elapsed:.1f}s")
    logger.info(f"   Total Containers: {summary['total_containers']}")
    logger.info(f"   Critical: {summary['critical_count']} ({summary['critical_percentage']}%)")
    logger.info(f"   Low Risk: {summary['low_risk_count']}")
    logger.info(f"   Avg Risk Score: {summary['avg_risk_score']}")
    logger.info(f"{'=' * 60}")
    
    return output_csv, dashboard_data


if __name__ == "__main__":
    run_inference()
