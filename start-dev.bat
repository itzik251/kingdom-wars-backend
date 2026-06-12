@echo off
title Kingdom Wars - Dev Server
echo Starting Kingdom Wars Dev Environment...

:: Kill existing node processes
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

:: Set environment variables
set NODE_ENV=development
set JWT_SECRET=kingdom_wars_dev_secret_key_minimum_32_characters_long
set TELEGRAM_BOT_TOKEN=8848286918:AAFToWCC4ZNb0N45opEkTNaiqhF0X3EmlQk
set PORT=3000
set ADMIN_SECRET=admin123dev

:: Start backend in new window
start "Backend :3000" cmd /k "set NODE_ENV=development && set JWT_SECRET=kingdom_wars_dev_secret_key_minimum_32_characters_long && set TELEGRAM_BOT_TOKEN=8848286918:AAFToWCC4ZNb0N45opEkTNaiqhF0X3EmlQk && set PORT=3000 && set ADMIN_SECRET=admin123dev && node C:\Users\A\Desktop\game\dist\src\main.js"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
start "Frontend :5173" cmd /k "cd /d C:\Users\A\Desktop\game\frontend && npx vite"

echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:3000/api/admin  (password: admin123dev)
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the servers.
pause
