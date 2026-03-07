# 🛠️ Tech Stack

## Backend (ML Pipeline)

| Component             | Technology                             | Why                                              |
| --------------------- | -------------------------------------- | ------------------------------------------------ |
| **Language**          | Python 3.11+                           | ML ecosystem, pandas, scikit-learn               |
| **ML Models**         | XGBoost, LightGBM                      | Best-in-class gradient boosting for tabular data |
| **Anomaly Detection** | Isolation Forest + Statistical + Rules | Hybrid approach for robust detection             |
| **Explainability**    | SHAP (TreeExplainer)                   | Gold-standard model interpretability             |
| **API Framework**     | FastAPI                                | Async, auto-docs, type-safe REST API             |
| **Computer Vision**   | Roboflow Inference                     | Container damage object detection                |
| **Database & Auth**   | SQLite, SQLAlchemy, python-jose (JWT)  | Persistent data & JWT authorization              |
| **Data Processing**   | Pandas, NumPy                          | Industry-standard data manipulation              |

## Frontend (Dashboard)

| Component      | Technology                      | Why                               |
| -------------- | ------------------------------- | --------------------------------- |
| **Framework**  | Next.js 14 (App Router)         | SSR, API routes, production-ready |
| **UI Library** | React 18                        | Component-based, rich ecosystem   |
| **Charts**     | Recharts                        | React-native, responsive charting |
| **Styling**    | CSS Modules + Custom Properties | Glassmorphism dark theme, no deps |
| **Icons**      | Lucide React                    | Lightweight, consistent icons     |

## Infrastructure

| Component           | Technology       | Why                               |
| ------------------- | ---------------- | --------------------------------- |
| **Frontend Deploy** | Vercel           | Zero-config Next.js hosting       |
| **Backend Deploy**  | Railway / Render | Python API hosting with free tier |
| **Version Control** | Git + GitHub     | Standard, collaboration-ready     |

## Key Python Libraries

```
pandas==2.2.3        # Data manipulation
numpy==1.26.4        # Numerical computing
scikit-learn==1.6.1  # ML utilities, Isolation Forest
xgboost==2.1.4       # Gradient boosting (primary model)
lightgbm==4.5.0      # Gradient boosting (secondary model)
shap==0.46.0         # Model explainability
fastapi==0.115.8     # REST API framework
uvicorn==0.34.0      # ASGI server
joblib==1.4.2        # Model serialization
```
