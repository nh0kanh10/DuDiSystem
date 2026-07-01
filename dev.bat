@echo off
echo Killing old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo Starting backend...
start "Backend" cmd /k "cd /d %~dp0backend && node src/server.js"

echo Starting frontend...
start "Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo Done. Backend: http://localhost:3001 ^| Frontend: http://localhost:5173
