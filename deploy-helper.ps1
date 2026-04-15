# PowerShell Script de ayuda para deployment
# REVERDECER PIURA - Deployment Helper

Write-Host "🌳 REVERDECER PIURA - Deployment Helper" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. Generar NEXTAUTH_SECRET" -ForegroundColor Cyan
Write-Host "2. Ver información del repositorio" -ForegroundColor Cyan
Write-Host "3. Push cambios a GitHub" -ForegroundColor Cyan
Write-Host "4. Verificar build local" -ForegroundColor Cyan
Write-Host "5. Abrir GitHub en navegador" -ForegroundColor Cyan
Write-Host "6. Abrir Vercel en navegador" -ForegroundColor Cyan
Write-Host "7. Abrir Neon en navegador" -ForegroundColor Cyan
Write-Host ""

$option = Read-Host "Selecciona una opción (1-7)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "🔐 Generando NEXTAUTH_SECRET..." -ForegroundColor Yellow
        $secret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        Write-Host ""
        Write-Host "Tu NEXTAUTH_SECRET:" -ForegroundColor Green
        Write-Host $secret -ForegroundColor White
        Write-Host ""
        Write-Host "☝️ Copia este valor y úsalo como NEXTAUTH_SECRET en Vercel" -ForegroundColor Yellow
        
        # Copiar al portapapeles si está disponible
        try {
            $secret | Set-Clipboard
            Write-Host "✅ Copiado al portapapeles!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ No se pudo copiar automáticamente" -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host ""
        Write-Host "📍 Repositorio GitHub:" -ForegroundColor Cyan
        git remote -v
        Write-Host ""
        Write-Host "📊 Estado actual:" -ForegroundColor Cyan
        git status
        Write-Host ""
        Write-Host "🔗 URL: https://github.com/EdsonMore/REVERDECER_PIURA_PAGINAWEB" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        $msg = Read-Host "Mensaje del commit"
        Write-Host "📤 Subiendo cambios a GitHub..." -ForegroundColor Yellow
        git add .
        git commit -m "$msg"
        git push origin main
        Write-Host ""
        Write-Host "✅ Cambios subidos a GitHub exitosamente!" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "🔨 Verificando build..." -ForegroundColor Yellow
        npm run build
    }
    "5" {
        Write-Host ""
        Write-Host "🌐 Abriendo GitHub..." -ForegroundColor Cyan
        Start-Process "https://github.com/EdsonMore/REVERDECER_PIURA_PAGINAWEB"
    }
    "6" {
        Write-Host ""
        Write-Host "🌐 Abriendo Vercel..." -ForegroundColor Cyan
        Start-Process "https://vercel.com/new"
    }
    "7" {
        Write-Host ""
        Write-Host "🌐 Abriendo Neon..." -ForegroundColor Cyan
        Start-Process "https://neon.tech"
    }
    default {
        Write-Host "❌ Opción no válida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona Enter para salir..." -ForegroundColor Gray
Read-Host
