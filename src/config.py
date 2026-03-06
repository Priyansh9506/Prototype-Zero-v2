from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "SmartContainer Risk Engine API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR / "models"
    OUTPUT_DIR: Path = BASE_DIR / "output"
    
    # Model Config (Weights configurable)
    XGB_WEIGHT: float = 0.40
    LGBM_WEIGHT: float = 0.35
    ANOMALY_WEIGHT: float = 0.25
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # JWT Auth
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week
    
    # Database
    DATABASE_URL: str = "sqlite:///./smartcontainer.db"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
