@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0"

echo ============================================================
echo  Gestor NFSe - Instalacao de dependencias
echo ============================================================
echo.

echo [1/6] Extraindo Node.js...
cd /d "%ROOT_DIR%tools"
if exist "node.zip" (
    tar -xf node.zip
    if exist "node-v22.14.0-win-x64" (
        ren node-v22.14.0-win-x64 node
    )
    del node.zip
    echo  OK - Node.js extraido
) else (
    echo  node.zip nao encontrado em %ROOT_DIR%tools
)
echo.

set "NODE_DIR=%ROOT_DIR%tools\node"
set "PATH=%NODE_DIR%;%PATH%"

echo [2/6] Verificando Node.js...
call node --version
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado em %NODE_DIR%
    echo Verifique se a extracao do node.zip funcionou.
    pause
    exit /b 1
)
call npm --version
echo.

echo [3/6] Instalando dependencias do backend...
cd /d "%ROOT_DIR%backend"
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo ERRO: npm install backend falhou
    pause
    exit /b 1
)
echo.

echo [4/6] Compilando backend...
call npm run build
if errorlevel 1 (
    echo.
    echo ERRO: build backend falhou
    pause
    exit /b 1
)
echo.

echo [5/6] Instalando dependencias do frontend...
cd /d "%ROOT_DIR%frontend"
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo ERRO: npm install frontend falhou
    pause
    exit /b 1
)
echo.

echo [6/6] Compilando frontend...
call npm run build
if errorlevel 1 (
    echo.
    echo ERRO: build frontend falhou
    pause
    exit /b 1
)
echo.

echo ============================================================
echo  Instalacao concluida com sucesso!
echo ============================================================
echo.
echo  Para iniciar o servidor, execute o atalho "Gestor NFSe"
echo  na area de trabalho.
echo.
pause
