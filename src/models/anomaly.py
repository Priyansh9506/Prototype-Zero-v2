"""
Anomaly Detection Module
Hybrid approach: Isolation Forest + Statistical Z-scores + Domain Rules
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
from pathlib import Path

from src.config import settings
from src.logger import setup_logger

logger = setup_logger("src.models.anomaly")


class AnomalyDetector:
    def __init__(self):
        self.isolation_forest = None
        self.anomaly_features = [
            "weight_diff_pct", "value_per_kg", "Dwell_Time_Hours",
            "Declared_Value", "log_declared_value", "weight_ratio",
            "value_zscore", "dwell_zscore"
        ]
    
    def fit(self, X: pd.DataFrame):
        """Fit Isolation Forest on training data."""
        available_features = [f for f in self.anomaly_features if f in X.columns]
        X_anomaly = X[available_features].fillna(0).values
        
        self.isolation_forest = IsolationForest(
            n_estimators=200,
            contamination=0.05,  # ~5% expected anomaly rate
            max_features=0.8,
            random_state=42,
            n_jobs=-1,
        )
        self.isolation_forest.fit(X_anomaly)
        logger.info(f"Isolation Forest fitted on {X_anomaly.shape[0]} samples")
        return self
    
    def compute_anomaly_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Compute composite anomaly score (0-1) combining three methods:
        1. Isolation Forest score
        2. Statistical Z-score outlier score
        3. Domain-specific rule score
        """
        scores = pd.DataFrame(index=df.index)
        
        # 1. Isolation Forest Score (converted to 0-1)
        scores["if_score"] = self._isolation_forest_score(df)
        
        # 2. Statistical Z-Score Outlier Score
        scores["stat_score"] = self._statistical_score(df)
        
        # 3. Domain Rule Score
        scores["rule_score"] = self._domain_rule_score(df)
        
        # Weighted composite: IF=40%, Stats=30%, Rules=30%
        composite = (
            0.40 * scores["if_score"] +
            0.30 * scores["stat_score"] +
            0.30 * scores["rule_score"]
        )
        
        # Normalize to 0-1
        composite = composite.clip(0, 1)
        
        logger.info(f"Computed anomaly scores — mean: {composite.mean():.4f}, anomalies (>0.5): {(composite > 0.5).sum()}")
        
        return composite
    
    def _isolation_forest_score(self, df: pd.DataFrame) -> pd.Series:
        """Get anomaly score from Isolation Forest (0=normal, 1=anomalous)."""
        if self.isolation_forest is None:
            return pd.Series(0, index=df.index)
        
        available_features = [f for f in self.anomaly_features if f in df.columns]
        X = df[available_features].fillna(0).values
        
        # decision_function returns negative for anomalies, positive for normal
        raw_scores = self.isolation_forest.decision_function(X)
        
        # Convert to 0-1 where 1 = most anomalous
        # More negative = more anomalous
        min_score = raw_scores.min()
        max_score = raw_scores.max()
        if max_score - min_score == 0:
            return pd.Series(0, index=df.index)
        
        normalized = 1 - (raw_scores - min_score) / (max_score - min_score)
        return pd.Series(normalized, index=df.index)
    
    def _statistical_score(self, df: pd.DataFrame) -> pd.Series:
        """Z-score based outlier detection across key numeric features."""
        zscore_features = ["weight_diff_pct", "value_per_kg", "Dwell_Time_Hours", "Declared_Value"]
        available = [f for f in zscore_features if f in df.columns]
        
        outlier_counts = pd.Series(0, index=df.index, dtype=float)
        
        for col in available:
            vals = df[col]
            mean_val = vals.mean()
            std_val = vals.std()
            if std_val == 0:
                continue
            z = abs((vals - mean_val) / std_val)
            # Count how many standard deviations away (normalized)
            outlier_counts += (z / 5).clip(0, 1)  # Cap at 5 std devs
        
        # Normalize by number of features
        if len(available) > 0:
            outlier_counts = outlier_counts / len(available)
        
        return outlier_counts.clip(0, 1)
    
    def _domain_rule_score(self, df: pd.DataFrame) -> pd.Series:
        """Domain-specific customs rules for anomaly detection."""
        score = pd.Series(0.0, index=df.index)
        
        # Rule 1: Weight discrepancy > 15%
        if "weight_diff_pct" in df.columns:
            score += (df["weight_diff_pct"] > 15).astype(float) * 0.3
            score += (df["weight_diff_pct"] > 30).astype(float) * 0.2  # Extra penalty for extreme
        
        # Rule 2: Zero declared value with significant weight
        if "is_zero_value" in df.columns and "Declared_Weight" in df.columns:
            score += ((df["is_zero_value"] == 1) & (df["Declared_Weight"] > 100)).astype(float) * 0.25
        
        # Rule 3: Extremely high value per kg
        if "value_per_kg" in df.columns:
            q99 = df["value_per_kg"].quantile(0.99)
            score += (df["value_per_kg"] > q99).astype(float) * 0.15
        
        # Rule 4: Unusually long dwell time
        if "is_long_dwell" in df.columns:
            score += df["is_long_dwell"].astype(float) * 0.15
        
        # Rule 5: Night-time high-value declarations
        if "night_high_value" in df.columns:
            score += df["night_high_value"].astype(float) * 0.1
        
        # Rule 6: Zero measured weight (potentially evaded weighing)
        if "is_zero_measured_weight" in df.columns:
            score += df["is_zero_measured_weight"].astype(float) * 0.2
        
        return score.clip(0, 1)
    
    def get_anomaly_flags(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return detailed anomaly flags for explainability."""
        flags = pd.DataFrame(index=df.index)
        
        flags["weight_anomaly"] = (df.get("weight_diff_pct", 0) > 15)
        flags["value_anomaly"] = (df.get("is_zero_value", 0) == 1)
        flags["extreme_value"] = (df.get("is_extreme_value", 0) == 1)
        flags["dwell_anomaly"] = (df.get("is_long_dwell", 0) == 1)
        flags["night_anomaly"] = (df.get("is_night_declaration", 0) == 1)
        flags["overweight"] = (df.get("is_overweight", 0) == 1)
        flags["underweight"] = (df.get("is_underweight", 0) == 1)
        
        return flags
    
    def save(self, path: str = None):
        """Save the anomaly detector."""
        if path is None:
            path = settings.MODELS_DIR / "anomaly_detector.joblib"
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"isolation_forest": self.isolation_forest, "features": self.anomaly_features}, path)
        logger.info(f"Detector saved to {path}")
    
    def load(self, path: str = None):
        """Load the anomaly detector."""
        if path is None:
            path = settings.MODELS_DIR / "anomaly_detector.joblib"
        data = joblib.load(path)
        self.isolation_forest = data["isolation_forest"]
        self.anomaly_features = data["features"]
        logger.info(f"Detector loaded from {path}")
        return self
