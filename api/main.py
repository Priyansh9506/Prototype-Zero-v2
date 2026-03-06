"""
FastAPI Server
REST API for the SmartContainer Risk Engine.
Provides endpoints for predictions, dashboard data, and container details.
"""

import sys
import os
import json
import tempfile
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
import pandas as pd
from sqlalchemy.orm import Session

from src.config import settings
from src.logger import setup_logger
from api.database import engine, Base, get_db
from api import models_db, schemas, auth
from api.task_manager import task_manager

logger = setup_logger("api.main")

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartContainer Risk Engine API",
    description="AI/ML-based container shipment risk assessment system",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"], # Added Next.js origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Load pre-computed results on startup ----
DASHBOARD_DATA = None
PREDICTIONS_DF = None


def load_precomputed_data():
    """Load pre-computed dashboard data and predictions."""
    global DASHBOARD_DATA, PREDICTIONS_DF
    
    json_path = settings.OUTPUT_DIR / "dashboard_data.json"
    csv_path = settings.OUTPUT_DIR / "predictions.csv"
    
    if json_path.exists():
        with open(json_path) as f:
            DASHBOARD_DATA = json.load(f)
        logger.info(f"Dashboard data loaded ({len(DASHBOARD_DATA.get('predictions', []))} containers)")
    
    if csv_path.exists():
        PREDICTIONS_DF = pd.read_csv(csv_path)
        logger.info(f"Predictions CSV loaded ({len(PREDICTIONS_DF)} rows)")



@app.on_event("startup")
async def startup_event():
    load_precomputed_data()


# ---- Auth Endpoints ----

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models_db.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=models_db.UserRole.PENDING.value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.role == models_db.UserRole.PENDING.value:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending verification by an Administrator",
        )
    access_token_expires = auth.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.put("/admin/verify_user/{user_id}", response_model=schemas.UserResponse)
def verify_user(
    user_id: int, 
    role: str = Query(..., description="Role to assign: officer or admin"),
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(auth.get_current_admin)
):
    if role not in [models_db.UserRole.OFFICER.value, models_db.UserRole.ADMIN.value]:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    
    user = db.query(models_db.User).filter(models_db.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
        
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@app.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models_db.User = Depends(auth.get_current_active_user)):
    return current_user


# ---- API Endpoints ----

@app.get("/")
async def root():
    """Health check and API info."""
    return {
        "name": "SmartContainer Risk Engine API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/stats", "/results", "/predictions", "/container/{container_id}", "/predict"],
    }


@app.get("/stats")
async def get_stats(current_user: models_db.User = Depends(auth.get_current_officer_or_admin)):
    """Get dashboard summary statistics."""
    if DASHBOARD_DATA is None:
        raise HTTPException(status_code=404, detail="No pre-computed data found. Run inference first.")
    
    return {
        "summary": DASHBOARD_DATA.get("summary", {}),
        "risk_distribution": DASHBOARD_DATA.get("risk_distribution", {}),
        "anomaly_distribution": DASHBOARD_DATA.get("anomaly_distribution", {}),
        "feature_importance": dict(list(DASHBOARD_DATA.get("feature_importance", {}).items())[:15]),
        "country_risk": DASHBOARD_DATA.get("country_risk", [])[:20],
    }


@app.get("/results")
async def get_results(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=500),
    risk_level: str = Query(None),
    sort_by: str = Query("risk_score"),
    sort_order: str = Query("desc"),
    search: str = Query(None),
    current_user: models_db.User = Depends(auth.get_current_officer_or_admin)
):
    """Get paginated prediction results with filtering and sorting."""
    if DASHBOARD_DATA is None:
        raise HTTPException(status_code=404, detail="No pre-computed data found.")
    
    predictions = DASHBOARD_DATA.get("predictions", [])
    
    # Filter by risk level
    if risk_level:
        predictions = [p for p in predictions if p["risk_level"] == risk_level]
    
    # Search by container ID
    if search:
        predictions = [p for p in predictions if search.lower() in str(p["container_id"]).lower()]
    
    # Sort
    reverse = sort_order == "desc"
    sort_key = sort_by.replace("risk_score", "risk_score")
    predictions = sorted(predictions, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    # Paginate
    total = len(predictions)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "data": predictions[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@app.get("/container/{container_id}")
async def get_container(
    container_id: str,
    current_user: models_db.User = Depends(auth.get_current_officer_or_admin)
):
    """Get detailed information for a specific container."""
    if DASHBOARD_DATA is None:
        raise HTTPException(status_code=404, detail="No pre-computed data found.")
    
    predictions = DASHBOARD_DATA.get("predictions", [])
    
    # Find the container
    container = None
    for p in predictions:
        if str(p["container_id"]) == str(container_id):
            container = p
            break
    
    if container is None:
        raise HTTPException(status_code=404, detail=f"Container {container_id} not found")
    
    return container


@app.get("/predictions")
async def get_predictions_csv(current_user: models_db.User = Depends(auth.get_current_officer_or_admin)):
    """Get predictions in CSV-compatible JSON format."""
    if PREDICTIONS_DF is None:
        raise HTTPException(status_code=404, detail="No predictions file found.")
    
    return PREDICTIONS_DF.to_dict(orient="records")


@app.post("/predict")
async def predict_from_upload(
    file: UploadFile = File(...),
    current_user: models_db.User = Depends(auth.get_current_officer_or_admin)
):
    """
    Upload a CSV file and get predictions (synchronous).
    This runs the full inference pipeline on the uploaded data.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Run inference
        from src.pipeline import run_inference
        predictions_df, dashboard_data = run_inference(
            data_path=tmp_path,
            output_dir="output"
        )
        
        # Update cached data
        global DASHBOARD_DATA, PREDICTIONS_DF
        DASHBOARD_DATA = dashboard_data
        PREDICTIONS_DF = predictions_df
        
        # Clean up
        os.unlink(tmp_path)
        
        return {
            "status": "success",
            "message": f"Processed {len(predictions_df)} containers",
            "summary": dashboard_data["summary"],
            "predictions": predictions_df.to_dict(orient="records"),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ---- Async Batch Prediction (V3 Blueprint) ----

def _run_inference_background(task_id: str, tmp_path: str):
    """Background worker that runs inference and updates task progress."""
    try:
        task_manager.update_task(task_id, status="processing", progress=10, message="Loading data...")
        
        from src.pipeline import run_inference
        task_manager.update_task(task_id, progress=30, message="Running inference pipeline...")
        
        predictions_df, dashboard_data = run_inference(
            data_path=tmp_path,
            output_dir="output"
        )
        
        task_manager.update_task(task_id, progress=80, message="Updating cached data...")
        
        # Update cached data
        global DASHBOARD_DATA, PREDICTIONS_DF
        DASHBOARD_DATA = dashboard_data
        PREDICTIONS_DF = predictions_df
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            message=f"Processed {len(predictions_df)} containers",
            result={
                "summary": dashboard_data["summary"],
                "total_containers": len(predictions_df),
            },
        )
    except Exception as e:
        logger.error(f"Background inference failed for task {task_id}: {e}")
        task_manager.update_task(
            task_id, status="failed", progress=100, error=str(e), message="Inference failed"
        )
        # Clean up temp file on failure too
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.post("/predict/batch")
async def predict_batch_async(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: models_db.User = Depends(auth.get_current_officer_or_admin)
):
    """
    Upload a CSV file for asynchronous batch prediction.
    Returns a task_id immediately. Poll /tasks/{task_id} for progress.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    # Create a task and dispatch to background
    task_id = task_manager.create_task()
    background_tasks.add_task(_run_inference_background, task_id, tmp_path)
    
    return {
        "task_id": task_id,
        "status": "pending",
        "message": "Task queued. Poll /tasks/{task_id} for progress.",
    }


@app.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: models_db.User = Depends(auth.get_current_officer_or_admin)
):
    """Poll an async task's progress."""
    task = task_manager.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@app.get("/feature-importance")
async def get_feature_importance(current_user: models_db.User = Depends(auth.get_current_officer_or_admin)):
    """Get global feature importance ranking."""
    if DASHBOARD_DATA is None:
        raise HTTPException(status_code=404, detail="No pre-computed data found.")
    
    return DASHBOARD_DATA.get("feature_importance", {})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
