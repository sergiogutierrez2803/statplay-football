@echo off
echo Iniciando StatPlay Football...

start "Backend"  cmd /k "cd /d %~dp0server && node index.js"
timeout /t 2 /nobreak > nul
start "Frontend" cmd /k "cd /d %~dp0 && node frontend-server.js"
timeout /t 2 /nobreak > nul
start http://localhost:8080
