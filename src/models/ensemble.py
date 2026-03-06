"""
Ensemble Risk Scorer
Combines XGBoost, LightGBM, and Anomaly Detection into final risk scores.
"""

import numpy as np
import pandas as pd

from src.config import settings
from src.logger import setup_logger

logger = setup_logger("src.models.ensemble")


class EnsembleRiskScorer:
    """
    Combines multiple model outputs into a final risk score and categorization.
    
    Weighting:
    - XGBoost probability: 40%
    - LightGBM probability: 35%
    - Anomaly score: 25%
    """
    
    XGBOOST_WEIGHT = 0.40
    LGBM_WEIGHT = 0.35
    ANOMALY_WEIGHT = 0.25
    
    # Risk level thresholds
    CRITICAL_THRESHOLD = 55  # Score above this = Critical
    
    def __init__(self):
        self.XGBOOST_WEIGHT = settings.XGB_WEIGHT
        self.LGBM_WEIGHT = settings.LGBM_WEIGHT
        self.ANOMALY_WEIGHT = settings.ANOMALY_WEIGHT
    
    def compute_risk_scores(
        self,
        xgb_proba: np.ndarray,
        lgbm_proba: np.ndarray,
        anomaly_scores: pd.Series,
    ) -> pd.DataFrame:
        """
        Compute final risk scores from ensemble outputs.
        
        Args:
            xgb_proba: XGBoost probabilities [n_samples, 3] (Clear, LowRisk, Critical)
            lgbm_proba: LightGBM probabilities [n_samples, 3]
            anomaly_scores: Anomaly detector scores (0-1)
        
        Returns:
            DataFrame with Risk_Score and Risk_Level
        """
        n = len(anomaly_scores)
        
        # Convert class probabilities to risk score (0-100)
        # Risk = weighted combination of P(Low Risk) and P(Critical)
        # P(Clear)=class 0, P(Low Risk)=class 1, P(Critical)=class 2
        
        # XGBoost risk: heavily weight Critical probability
        xgb_risk = (xgb_proba[:, 1] * 30 + xgb_proba[:, 2] * 100)
        
        # LightGBM risk
        lgbm_risk = (lgbm_proba[:, 1] * 30 + lgbm_proba[:, 2] * 100)
        
        # Anomaly risk (already 0-1, scale to 0-100)
        anomaly_risk = anomaly_scores.values * 100
        
        # Weighted ensemble
        ensemble_risk = (
            self.XGBOOST_WEIGHT * xgb_risk +
            self.LGBM_WEIGHT * lgbm_risk +
            self.ANOMALY_WEIGHT * anomaly_risk
        )
        
        # Clip to 0-100
        ensemble_risk = np.clip(ensemble_risk, 0, 100)
        
        # Round to 2 decimal places
        ensemble_risk = np.round(ensemble_risk, 2)
        
        # Categorize
        risk_levels = np.where(
            ensemble_risk >= self.CRITICAL_THRESHOLD,
            "Critical",
            "Low Risk"
        )
        
        results = pd.DataFrame({
            "Risk_Score": ensemble_risk,
            "Risk_Level": risk_levels,
            "XGB_Risk": np.round(xgb_risk, 2),
            "LGBM_Risk": np.round(lgbm_risk, 2),
            "Anomaly_Risk": np.round(anomaly_risk, 2),
        })
        
        # Summary stats
        critical_count = (risk_levels == "Critical").sum()
        low_risk_count = (risk_levels == "Low Risk").sum()
        logger.info(f"Risk distribution — Critical: {critical_count} ({critical_count/n*100:.1f}%), Low Risk: {low_risk_count} ({low_risk_count/n*100:.1f}%)")
        logger.info(f"Risk score stats — Mean: {ensemble_risk.mean():.2f}, Median: {np.median(ensemble_risk):.2f}, Max: {ensemble_risk.max():.2f}")
        
        return results
    
    def get_risk_summary(self, results: pd.DataFrame) -> dict:
        """Generate summary statistics for dashboard."""
        return {
            "total_containers": len(results),
            "critical_count": int((results["Risk_Level"] == "Critical").sum()),
            "low_risk_count": int((results["Risk_Level"] == "Low Risk").sum()),
            "critical_percentage": round((results["Risk_Level"] == "Critical").sum() / len(results) * 100, 2),
            "avg_risk_score": round(results["Risk_Score"].mean(), 2),
            "median_risk_score": round(results["Risk_Score"].median(), 2),
            "max_risk_score": round(results["Risk_Score"].max(), 2),
            "min_risk_score": round(results["Risk_Score"].min(), 2),
            "avg_dwell": round(df_raw["Dwell_Time_Hours"].mean() if "Dwell_Time_Hours" in df_raw else 0, 2),
            "high_risk_containers": int((results["Risk_Score"] >= 70).sum()),
            "medium_risk_containers": int(((results["Risk_Score"] >= 40) & (results["Risk_Score"] < 70)).sum()),
            "low_risk_containers": int((results["Risk_Score"] < 40).sum()),
        }
