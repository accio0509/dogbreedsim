@echo off
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  start "DogBreeding" cmd /k py -3 -m http.server 5500 --bind 127.0.0.1
) else (
  where python >nul 2>&1
  if errorlevel 1 (
    echo Python 3 is required. Alternatively open index.html with VS Code Live Server.
    pause
    exit /b 1
  )
  start "DogBreeding" cmd /k python -m http.server 5500 --bind 127.0.0.1
)
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5500/index.html"
