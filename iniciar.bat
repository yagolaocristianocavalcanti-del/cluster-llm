@echo off
title LLM Cluster Trainer V3
color 0B

echo ======================================================================
echo          LLM CLUSTER TRAINER V3 - MOTOR UNICO DE IA DISTRIBUIDO
echo ======================================================================
echo.
echo [1/3] Verificando dependencias do Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    echo Por favor, instale o Node.js v18+ em https://nodejs.org/ e tente novamente.
    pause
    exit /b 1
)

echo [2/3] Compilando assets de frontend e orquestrador backend...
call npm run build
if %errorlevel% neq 0 (
    echo [AVISO] Falha na compilacao, iniciando em modo desenvolvimento (dev)...
    start http://localhost:3000
    call npm run dev
    pause
    exit /b 0
)

echo [3/3] Iniciando Servidor Mestre na porta 3000...
start http://localhost:3000
call npm start

pause
