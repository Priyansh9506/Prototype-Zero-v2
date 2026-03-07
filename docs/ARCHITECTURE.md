# 🏗️ System Architecture

## High-Level Overview

```mermaid
flowchart TD
    User["USER / JUDGE<br>(Browser / API Client)"]

    subgraph Frontend["Next.js Frontend"]
        direction TB
        F_Pages["SPA Dashboard Components<br>(Overview, Analytics, Containers, Detail, ImageAnalysis, Admin, Settings)"]
        F_API["API Client<br>(JWT Auth)"]
        F_Pages --- F_API
    end

    subgraph Backend["FastAPI Backend"]
        direction TB
        B_Routes["/stats<br>/results<br>/container/{id}<br>/predict<br>/analyze-container-image<br>/login, /register, /admin/users"]
        B_Tasks["In-Memory Task Manager<br>(BackgroundTasks)"]
        B_Routes --- B_Tasks
    end

    subgraph ML_Pipeline["ML Pipeline"]
        direction TB
        L["Data Loader"] --> P["Preprocessor"]
        P --> F["Feature Engineering"]
        F --> E["Ensemble Model"]
        E --> S["SHAP Explainability"]
    end

    User --> Frontend
    Frontend -- "REST API" --> Backend
    Backend --> ML_Pipeline
```

## Data Flow

### Training Flow

```mermaid
flowchart TD
    A["Historical Data (54K records)"] --> B["Data Loader<br>(schema validation, date normalization)"]
    B --> C["Preprocessor<br>(label encoding, type casting)"]

    C --> D["Feature Engineering<br>(40+ features)"]
    D --> E["Model Training<br>(XGBoost + LightGBM + Isolation Forest)"]

    E --> F["Save Models + Encoders + Behavioral Stats<br>(.joblib)"]
```

### Inference Flow

```mermaid
flowchart TD
    A["Real-Time Data (8.5K records) OR Uploaded CSV"] --> B["Data Loader<br>(schema validation)"]
    B --> C["Preprocessor<br>(use fitted encoders)"]
    C --> D["Feature Engineering<br>(use behavioral stats from training)"]
    D --> E["Model Prediction<br>(load saved models)"]
    E --> F["Ensemble Risk Scoring<br>(weighted combination)"]
    F --> G["SHAP Explainability<br>(top-3 features per container)"]
    G --> H["Rule-Based NL Explanations<br>(human-readable summaries)"]
    H --> I["Output: predictions.csv + dashboard_data.json"]
```

## API Endpoints

| Method | Endpoint                              | Description                                     |
| ------ | ------------------------------------- | ----------------------------------------------- |
| `GET`  | `/`                                   | Health check                                    |
| `GET`  | `/stats`                              | Dashboard summary statistics                    |
| `GET`  | `/results?page=1&risk_level=Critical` | Paginated results with filtering                |
| `GET`  | `/container/{id}`                     | Single container detail + SHAP explanation      |
| `GET`  | `/predictions`                        | All predictions (CSV format)                    |
| `POST` | `/predict`                            | Upload CSV → run inference → return predictions |
| `GET`  | `/feature-importance`                 | Global feature importance ranking               |
| `POST` | `/analyze-container-image`            | Object detection for container damage           |
| `POST` | `/login`, `/register`                 | JWT Authentication                              |

## Ensemble Model Architecture

```mermaid
flowchart TD
    Input["Input Features (40+)"]

    Input --> XGB["XGBoost<br>(multi-class)"]
    Input --> LGBM["LightGBM<br>(multi-class)"]
    Input --> Anom["Anomaly Detection<br>(Isolation Forest + Stats + Rules)"]

    XGB -- "P(class) (40%)" --> WA["Weighted Avg Risk Score<br>(0 - 100)"]
    LGBM -- "P(class) (35%)" --> WA
    Anom -- "Anomaly Score (25%)" --> WA

    WA --> Thresh["Thresholding<br>≥55 → Critical<br><55 → Low Risk"]
```
