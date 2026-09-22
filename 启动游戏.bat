@echo off
cd /d "%~dp0"
start "" code .
start "Dev Server" cmd /k npm run dev
