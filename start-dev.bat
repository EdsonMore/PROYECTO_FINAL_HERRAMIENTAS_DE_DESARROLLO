@echo off
REM Matar todos los procesos node
taskkill /IM node.exe /F 2>nul
timeout /t 2 /nobreak

REM Matar proceso específico en puerto 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /PID %%a /F /T 2>nul
)
timeout /t 2 /nobreak

REM Limpiar cache de Next.js
rmdir /s /q .next 2>nul

REM Instalar dependencias
call pnpm install --ignore-scripts

REM Iniciar servidor
pnpm dev
