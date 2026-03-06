@echo off
echo ======================================================
echo SmartContainer Risk Engine - Quick Setup (Windows)
echo ======================================================

echo [1/3] Setting up Python Virtual Environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo [ERROR] Python not found or failed to create venv.
    pause
    exit /b
)
call .\venv\Scripts\activate
pip install -r requirements.txt
python verify_user.py

cd dashboard
echo Installing critical components (Lucide, Recharts, Framer Motion, etc)...
npm install lucide-react recharts papaparse framer-motion clsx --save --force
echo Installing all remaining frontend dependencies...
npm install --force
cd ..

echo [3/3] Setup complete! 
echo.
echo TO START THE PROJECT:
echo 1. Run run_backend.bat
echo 2. Run run_frontend.bat
echo.
echo Login with testadmin / password123
pause
