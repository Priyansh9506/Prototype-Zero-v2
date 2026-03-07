# 🏗️ System Architecture

## High-Level Overview

![System Architecture](images/architecture.jpeg)

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

![Ensemble Model Architecture](images/EnsembleModelArchitecture.jpeg)
