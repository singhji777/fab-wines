@echo off
setlocal
title Fab Wines
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is missing. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b
)
if not exist .env (
  copy .env.example .env >nul
  echo Created .env. Open it, paste your Neon DATABASE_URL and set ADMIN_PASSWORD, then run this file again.
  notepad .env
  exit /b
)
if not exist node_modules call npm install
node check-db.js
if errorlevel 1 (
  echo Could not reach the database. Check DATABASE_URL in .env.
  pause
  exit /b
)
node server.js --open
pause
