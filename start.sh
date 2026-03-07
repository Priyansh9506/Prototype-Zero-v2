#!/bin/bash
python -c "from api.database import engine, Base; Base.metadata.create_all(bind=engine); print('DB tables ready')"
exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
