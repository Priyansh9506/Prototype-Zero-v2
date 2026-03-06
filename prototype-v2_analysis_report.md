# Prototype-Zero-v2 Architecture & Analysis Report

## 1. High-Level Overview & Architecture

**Primary Purpose**  
The codebase implements the "SmartContainer Risk Engine," an AI/ML-driven solution designed to evaluate container shipments. It predicts risk levels (Critical vs. Low Risk) and identifies potential anomalies like smuggling, customs evasion, or misdeclarations using historical and real-time data.

**System Architecture & Design Pattern**  
The project relies on a decoupled, client-server architecture:

- **Backend (API & ML):** A RESTful API built with Python, FastAPI, and Uvicorn (`api/main.py`), acting as the inference and data-serving layer.
- **Frontend (UI/UX):** A web dashboard constructed using Next.js 16 (`dashboard/src/app`).
- **Data Flow Pattern:** A unidirectional pipeline pattern is leveraged for the machine learning workflow (Data Loading → Preprocessing → Feature Engineering → Model Ensemble → Explainability → Output).

**Technology Stack**

- _Backend & ML:_ Python, FastAPI, Uvicorn, Pandas, NumPy, Scikit-Learn, XGBoost, LightGBM, SHAP, Joblib.
- _Frontend:_ Next.js (React 19), Recharts (data visualizations), Lucide React (iconography).

## 2. Core Features & Functionalities

**Main Features**

- **Risk Scoring & Profiling:** Ingests container data and generates a composite "Risk Score" (0-100) along with a string literal "Risk Level".
- **Advanced Feature Engineering:** Extracts over 40 complex features (`src/features/engineering.py`), such as weight discrepancies, value anomalies, dwell time standard deviations, cyclical time encodings, and compound interaction features (e.g., Night-time + High Value).
- **Dashboard Analytics:** Computes live statistics, risk distributions, anomaly tracking, country-based risk indexing, and ranks top critical containers.

**Data Flow**

1. Raw CSV file payload is posted to the `/predict` FastAPI endpoint.
2. The pipeline (`src/pipeline.py`) validates the schema, normalizes dates, and applies trained `joblib` encoders.
3. Feature engineering expands the dataset using historical behavioral stats.
4. Ensemble models execute predictions resulting in anomaly scores and probabilities.
5. `shap_explainer` and `rule_explainer` translate scores into natural language explanations.
6. The backend caches results globally and saves them to an `output/` directory as `predictions.csv` and `dashboard_data.json`.
7. The Next.js frontend fetches and visualizes these JSON outputs.

## 3. AI & Machine Learning Implementation

**Models & Ensemble Approach**
The ML architecture is defined in `src/models/ensemble.py` and uses a weighted multi-model paradigm to improve robustness:

1. **XGBoost Risk Model** (40% Weight): A gradient boosting tree tailored for tabular predictive accuracy.
2. **LightGBM Risk Model** (35% Weight): A highly efficient gradient boosting model ensuring faster inferencing.
3. **Anomaly Detector** (25% Weight): A hybrid unsupervised and rule-based model (`src/models/anomaly.py`) utilizing Isolation Forest alongside statistical Z-Scores and domain-specific customs evasion logic (e.g., "Weight discrepancy > 15%", "Zero declared value with high weight").

**Model Training & Explainability**

- **Training Pipeline:** Managed via `src/train.py`, automatically encoding data, computing behavioral baseline limits, and generating serialized `joblib` models.
- **Explainability:** Employs the `SHAP` (SHapley Additive exPlanations) library to isolate the top global and local risk-driving features per prediction. These algorithmic findings are mapped into Natural Language in `src/explainability/rule_explainer.py`.

## 4. Code Quality, Patterns, and Maintainability

**Code Quality & Readability**

- The repository showcases clean, modular Python structure separating concerns effectively (`src/data`, `src/features`, `src/models`, `src/explainability`).
- Well-written docstrings and semantic naming conventions are persistent throughout the codebase making onboarding and reviewing quite facile.

**Design Patterns**

- **Encapsulation:** Object-oriented wrappers are used extensively for the ML ecosystem (e.g., `XGBoostRiskModel`, `EnsembleRiskScorer`, `AnomalyDetector`).
- **Pipeline Strategy:** Explicit separation of Data Engineering and Training allows `train.py` and `pipeline.py` (inferencing) to mutually share pure functions from `engineering.py`.

**Maintainability & Extensions**

- Feature additions are simplified inside `engineering.py`.
- Error handling exists within FastAPI using `HTTPException` routing, though could be expanded. Logging is currently handled with standard `print` statements rather than Python's `logging` module.

## 5. UI / UX

**Frontend Interface**

- The UI (`dashboard/src/app/page.js`) features a minimalist, responsive, glassmorphic aesthetic—adhering closely to state-of-the-art corporate analytics designs.
- Custom CSS shapes "glass cards," risk bars, and animated loader overlays (`globals.css`).
- It integrates `recharts` to render interactive widgets such as: Risk Level Pie Charts, Score Distribution Bar Charts, and Anomaly Composition Graphics.

**Communication**

- The Next.js frontend uses client-side data fetching (`useEffect`) pointing via helper utilities (`lib/data.js`) to the backend API.
- Re-renders gracefully using loading states when awaiting long-running inference tasks.

## 6. Strengths & Weaknesses

**Strengths**

- **Powerful ML Ensemble:** Combining supervised trees (XGB/LGBM) with unsupervised anomaly detection perfectly complements fraud detection use-cases where training data labels might be flawed.
- **High Explainability:** Bypasses the "black box" criticism of ML models by delivering actionable, plain-text justifications using SHAP boundaries.
- **Clean Modularity:** Highly organized folders and files mimicking best practices.
- **Exceptional Presentation Layer:** Modern UI ensures user adoption from non-technical dashboard operators.

**Weaknesses**

- **Hardcoded Configurations:** Several thresholds (e.g., `CRITICAL_THRESHOLD = 55`), file paths (`output/` directory logic), and ports are hardcoded instead of sitting within standard `.env` configuration files.
- **Global API State Reliance:** The FastAPI `main.py` uses global Python variables (`DASHBOARD_DATA = None`) to persist state across sessions. This will fail completely in multi-worker deployment environments (e.g., Gunicorn/Uvicorn with workers > 1).
- **Persistent Storage:** Completely lacks a robust database mechanism; purely relies on `.csv` and `.json` files which creates severe bottlenecks for scalability.

## 7. Scalability & Deployment

**Production Readiness**

- While representing an incredibly robust prototype or MVP, the system requires infrastructural improvements prior to achieving full production-readiness.

**Bottlenecks & Scalability**

- **Synchronous Inferencing:** Uploading a large CSV to the `/predict` endpoint locks the request thread while the pipeline evaluates it. This requires offloading into a task queue queue like Celery or RabbitMQ.
- **Caching Mechanism:** The global memory cache must be offloaded to a Redis instance.

**Automated Systems**

- Currently, there is a visible lack of a dedicated `tests/` directory; automated unit testing pipelines (e.g., `pytest`, `jest`) are omitted.
- CI/CD scripts are absent.
