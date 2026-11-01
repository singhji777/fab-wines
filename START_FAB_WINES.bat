@echo off
setlocal
title Fab Wines
cd /d "%~dp0"
echo.
echo  ==============  FAB WINES  ==============
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [1/5] Installing Node.js, please accept any prompt...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  echo.
  echo Node.js is installed. CLOSE this window and double-click START_FAB_WINES.bat again.
  pause
  exit /b
)
echo [1/5] Node.js found.

if not exist .env (
  echo MONGODB_URI=mongodb://127.0.0.1:27017> .env
  echo MONGODB_DB=fabwines>> .env
  echo ADMIN_EMAIL=adityasingh11may@gmail.com>> .env
  echo ADMIN_PASSWORD=FabAdmin@2026>> .env
  echo [2/5] Created settings file .env
) else (
  echo [2/5] Settings file found.
)

if not exist node_modules (
  echo [3/5] Installing the shop, about a minute...
  call npm install --omit=dev
  if errorlevel 1 ( echo Install failed. Check your internet and run this file again. & pause & exit /b )
) else (
  echo [3/5] Shop already installed.
)

node check-db.js >nul 2>nul
if errorlevel 1 (
  echo [4/5] MongoDB is not running. Trying to start it...
  net start MongoDB >nul 2>nul
  timeout /t 4 /nobreak >nul
  node check-db.js >nul 2>nul
)
if errorlevel 1 (
  echo MongoDB is not installed. Installing it now, please accept the prompts...
  winget install -e --id MongoDB.Server --accept-package-agreements --accept-source-agreements
  net start MongoDB >nul 2>nul
  timeout /t 6 /nobreak >nul
  node check-db.js >nul 2>nul
)
if errorlevel 1 (
  echo.
  echo  Could not start MongoDB automatically.
  echo  - If you use MongoDB Atlas, put your connection string in the .env file as MONGODB_URI=...
  echo  - Otherwise start the "MongoDB" service from Windows Services, then run this file again.
  echo  - If it still fails, right-click this file and choose "Run as administrator".
  pause
  exit /b
)
echo [4/5] MongoDB is running.

echo [5/5] Loading the wines into MongoDB and starting the shop...
node server.js --seed
echo.
echo  The shop opens in your browser in a moment.
echo  Owner dashboard:  /admin.html   (adityasingh11may@gmail.com, password is in the .env file)
echo  Keep this window open while you use the shop. Close it to stop.
echo.
node server.js --open
pause
