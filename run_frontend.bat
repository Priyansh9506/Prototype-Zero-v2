@echo off
echo Starting SmartContainer Frontend...
if not exist dashboard\node_modules (
    echo [ERROR] Frontend dependencies not found. Please run setup.bat first.
    pause
    exit /b
)
cd dashboard
npm run dev
pause
