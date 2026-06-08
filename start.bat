@echo off
title Gestor NFSe

setlocal enabledelayedexpansion

set "TOOLS_DIR=%~dp0tools\node"
set "BACKEND_DIR=%~dp0backend"

if exist "%TOOLS_DIR%\node.exe" (
    set "PATH=%TOOLS_DIR%;%PATH%"
)

cd /d "%BACKEND_DIR%"

echo ============================================
echo   Gestor NFSe
echo   Iniciando servidor...
echo ============================================

start "" node dist\index.js

timeout /t 2 /nobreak >nul

echo Abrindo navegador...
start http://127.0.0.1:8001
