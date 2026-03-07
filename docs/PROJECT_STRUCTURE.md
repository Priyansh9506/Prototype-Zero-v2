# 📁 Project Structure

```
Prototype-Zero/
│
├── 📄 README.md                      # Project overview & setup instructions
├── 📄 requirements.txt               # Python dependencies
│
├── 📂 docs/                          # Documentation
│   ├── TECH_STACK.md                 # Technology choices & justification
│   ├── ARCHITECTURE.md               # System architecture & data flow diagrams
│   ├── SOLUTION_APPROACH.md          # Methodology & feature engineering details
│   └── PROJECT_STRUCTURE.md          # This file
│
├── 📂 Problem/                       # Given hackathon datasets
│   ├── Problem Statement.pdf         # Official problem statement
│   ├── Historical Data.csv           # Training data (54,000 records)
│   └── Real-Time Data.csv            # Inference data (8,481 records)
│
├── 📂 src/                           # Python ML Pipeline
│   ├── __init__.py
│   │
│   ├── 📂 data/                      # Data ingestion & cleaning
│   │   ├── __init__.py
│   │   ├── loader.py                 # CSV loading, date normalization, validation
│   │   └── preprocessor.py           # Label encoding, type casting, date parsing
│   │
│   ├── 📂 features/                  # Feature engineering
│   │   ├── __init__.py
│   │   └── engineering.py            # 40+ features (weight, value, time, behavioral)
│   │
│   ├── 📂 models/                    # ML models
│   │   ├── __init__.py
│   │   ├── xgboost_model.py          # XGBoost classifier (40% ensemble weight)
│   │   ├── lgbm_model.py             # LightGBM classifier (35% ensemble weight)
│   │   ├── anomaly.py                # Isolation Forest + Stats + Rules (25% weight)
│   │   └── ensemble.py               # Weighted ensemble combiner
│   │
│   ├── 📂 explainability/            # Model interpretability
│   │   ├── __init__.py
│   │   ├── shap_explainer.py         # SHAP TreeExplainer (top-3 features/sample)
│   │   └── rule_explainer.py         # Rule-based NL explanation generator
│   │
│   ├── train.py                      # Full training pipeline script
│   └── pipeline.py                   # Full inference pipeline script
│
├── 📂 api/                           # REST API
│   ├── main.py                       # FastAPI server, background tasks, inference execution
│   ├── auth.py                       # JWT authentication logic
│   ├── database.py                   # SQLite connection
│   ├── models_db.py                  # SQLAlchemy models
│   ├── schemas.py                    # Pydantic schema validation
│   └── task_manager.py               # In-memory background task tracking
│
├── 📂 dashboard/                     # Next.js React SPA Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.jsx              # Main Single Page Application shell
│   │   │   ├── api.js                # API client functions
│   │   │   ├── data.js               # Shared states/context
│   │   │   └── globals.css           # Global Theme & Tailwind CSS
│   │   ├── components/               # Feature Components
│   │   │   ├── Admin.jsx               # Admin user management
│   │   │   ├── Analytics.jsx           # Performance-optimized charts
│   │   │   ├── Containers.jsx          # Searchable container table & robust CSV exports
│   │   │   ├── DetailPanel.jsx         # Container inspection pane
│   │   │   ├── ImageAnalysis.jsx       # Visual damage assessment pane
│   │   │   ├── Login.jsx               # JWT Gateway
│   │   │   ├── Overview.jsx            # High-level metrics
│   │   │   ├── Settings.jsx            # Config toggles
│   │   │   ├── Sidebar.jsx             # Nav menu
│   │   │   └── UploadData.jsx          # CSV upload area

│   ├── package.json
│   └── next.config.js
│
├── 📂 models/                        # Saved model artifacts (generated)
│   ├── xgboost_model.joblib
│   ├── lgbm_model.joblib
│   ├── anomaly_detector.joblib
│   ├── encoders.joblib
│   ├── behavioral_stats.joblib
│   ├── feature_columns.joblib
│   └── training_metadata.json
│
└── 📂 output/                        # Prediction outputs (generated)
    ├── predictions.csv               # Required submission output
    └── dashboard_data.json           # Full dashboard data for frontend
```

## How to Run

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train Models

```bash
python src/train.py
```

### 3. Run Inference

```bash
python src/pipeline.py
```

### 4. Start API Server

```bash
python api/main.py
# or: uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### 5. Start Dashboard

```bash
cd dashboard
npm install
npm run dev
```
