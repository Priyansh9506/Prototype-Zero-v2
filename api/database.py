from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from src.config import settings

DATABASE_URL = settings.DATABASE_URL

# Fix: Railway/Supabase URLs may use "postgres://" instead of "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Strip any SQLite-specific query params that may be in the URL
if "check_same_thread" in DATABASE_URL:
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    parsed = urlparse(DATABASE_URL)
    params = parse_qs(parsed.query)
    params.pop("check_same_thread", None)
    new_query = urlencode({k: v[0] for k, v in params.items()})
    DATABASE_URL = urlunparse(parsed._replace(query=new_query))

# SQLite requires check_same_thread=False; PostgreSQL does not support it
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
