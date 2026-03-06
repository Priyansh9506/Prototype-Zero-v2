@echo off
echo Starting SmartContainer Backend...
if not exist venv (
    echo [ERROR] Virtual environment not found. Please run setup.bat first.
    pause
    exit /b
)
call .\venv\Scripts\activate
python -m uvicorn api.main:app --reload --reload-dir api --reload-dir src --port 8000
pause
