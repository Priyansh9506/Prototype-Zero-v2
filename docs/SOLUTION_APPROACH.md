# 🎯 Solution Approach

## Problem Understanding

### The Challenge

Global ports process thousands of containers daily. Traditional screening uses **static rules** and **manual checks** which:

- Miss hidden irregularities
- Generate unnecessary inspections
- Increase processing delays
- Fail to adapt to changing trade patterns

### Our Goal

Build a **SmartContainer Risk Engine** — an AI/ML system that:

1. Predicts a **Risk Score** (0-100) per container
2. Classifies as **Critical** or **Low Risk**
3. Detects **anomalies** in shipment patterns
4. Provides **human-readable explanations** for each prediction

---

## Dataset Analysis

### Key Findings

- **54,000 historical** + **8,481 real-time** container records
- **Severe class imbalance**: Critical = 1%, Low Risk = 20.6%, Clear = 78.4%
- **Zero nulls** — clean dataset
- **6,093 containers** (11.3%) have weight discrepancy >10%
- **506 containers** have zero declared value
- **396 containers** have zero declared weight
- **119 origin countries**, China dominates at 50.9%
- Date format inconsistency between datasets (DD-MM-YYYY vs YYYY-MM-DD)

---

## Methodology

### 1. Feature Engineering (40+ Features)

| Category           | Count | Examples                                                                 |
| ------------------ | ----- | ------------------------------------------------------------------------ |
| **Weight Anomaly** | 10    | `weight_diff_pct`, `is_overweight`, `weight_ratio`                       |
| **Value Analysis** | 7     | `value_per_kg`, `is_zero_value`, `value_zscore`                          |
| **HS Code**        | 3     | `hs_chapter`, `hs_heading`, `hs_chapter_frequency`                       |
| **Temporal**       | 7     | `is_night_declaration`, `hour_sin/cos`, `is_weekend`                     |
| **Dwell Time**     | 5     | `dwell_zscore`, `is_long_dwell`, `dwell_vs_port_avg`                     |
| **Behavioral**     | 10    | `importer_risk_rate`, `exporter_risk_rate`, `origin_country_risk_rate`   |
| **Interaction**    | 5     | `zero_value_high_weight`, `night_high_value`, `composite_anomaly_signal` |

**Why this matters**: Most teams will use raw features. Our 40+ engineered features capture **compound risk signals** that raw data misses.

### 2. Ensemble Model (3 Models Combined)

#### XGBoost (Weight: 40%)

- Multi-class classification (Clear / Low Risk / Critical)
- **Sample weights** to handle class imbalance (Critical is 100x rarer)
- Stratified 3-fold cross-validation
- Optimized hyperparameters (max_depth=8, lr=0.05, 500 estimators)

#### LightGBM (Weight: 35%)

- Same multi-class objective
- `is_unbalance=True` for automatic class rebalancing
- Different tree structure (leaf-wise vs level-wise) adds diversity

#### Anomaly Detection (Weight: 25%)

Hybrid approach combining three methods:

| Method                   | Weight | What It Catches                                                         |
| ------------------------ | ------ | ----------------------------------------------------------------------- |
| **Isolation Forest**     | 40%    | Complex multi-dimensional anomalies                                     |
| **Statistical Z-scores** | 30%    | Extreme values across key features                                      |
| **Domain Rules**         | 30%    | Customs-specific red flags (weight >15% diff, zero value + high weight) |

**Why ensemble?** No single model is best at everything. XGBoost and LightGBM use different tree-building strategies, and the anomaly detector catches patterns the supervised models might miss.

### 3. Explainability (SHAP + Rules)

#### SHAP TreeExplainer

- Computes per-feature contribution to each prediction
- Extracts **top 3 risk-driving features** per container
- Enables global feature importance ranking

#### Rule-Based Natural Language Generator

- Converts SHAP features + anomaly flags → human-readable text
- Example outputs:
  - _"High risk: weight discrepancy of 23.5%; importer has 12% historical risk rate; unusually long dwell time (156 hrs)."_
  - _"Low risk: Shipment parameters are within normal operational ranges."_

---


### 4. Image Damage Detection (Computer Vision)

- Analyzes container images via **Roboflow Inference API** (`container-damage-detection-uekkr/1`).
- Identifies features such as `dent`, `rust`, `hole`, `deframe`.
- Categorizes containers intelligently into **Safe**, **Faulty**, or **Damaged** states based on severity levels.
- Seamlessly injects dynamic mock SHAP values derived from identified damage patterns.

## What Makes Our Solution Stand Out

| Differentiator               | Details                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| **40+ engineered features**  | Behavioral profiling, cyclical time encoding, compound interactions |
| **Multi-model ensemble**     | XGBoost + LightGBM + Isolation Forest (most teams use single model) |
| **Hybrid anomaly detection** | Statistical + ML + Domain rules (triple-layered)                    |
| **SHAP explainability**      | Not just predictions but WHY — mandatory per problem statement      |
| **Full-stack dashboard**     | Next.js (SPA architecture) with glassmorphism UI, Recharts, drill-down |
| **Visual Inspection**        | Integrated Image Analysis Filters and robust CSV exports            |
| **REST API**                 | FastAPI with pagination, filtering, CSV upload → live prediction    |
| **Deployment-ready**         | Vercel + Railway, modular structure                                 |

---

## Output Format

### predictions.csv

```
Container_ID, Risk_Score, Risk_Level, Explanation_Summary
94895240, 78.5, Critical, "High risk: weight discrepancy of 23.5%; origin country elevated risk (15.2%)."
34131149, 12.3, Low Risk, "Low risk: Shipment parameters are within normal operational ranges."
```

### Dashboard Features

- Risk distribution pie/bar charts
- Top critical containers table
- Container detail with SHAP breakdown
- Origin country risk heatmap
- Feature importance visualization
- CSV upload for live predictions
