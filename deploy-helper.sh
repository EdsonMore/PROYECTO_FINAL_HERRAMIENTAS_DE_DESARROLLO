#!/bin/bash
# Script de ayuda para deployment

echo "🌳 REVERDECER PIURA - Deployment Helper"
echo "========================================"
echo ""
echo "1. Generar NEXTAUTH_SECRET"
echo "2. Ver información del repositorio"
echo "3. Push cambios a GitHub"
echo "4. Verificar build local"
echo "5. Ver guías de deployment"
echo ""
read -p "Selecciona una opción (1-5): " option

case $option in
    1)
        echo ""
        echo "Generando NEXTAUTH_SECRET..."
        openssl rand -base64 32
        echo ""
        echo "☝️ Copia este valor y úsalo como NEXTAUTH_SECRET en Vercel"
        ;;
    2)
        echo ""
        echo "📍 Repositorio GitHub:"
        git remote -v
        echo ""
        echo "📊 Estado actual:"
        git status
        ;;
    3)
        echo ""
        read -p "Mensaje del commit: " msg
        git add .
        git commit -m "$msg"
        git push origin main
        echo "✅ Cambios subidos a GitHub"
        ;;
    4)
        echo ""
        echo "🔨 Verificando build..."
        npm run build
        ;;
    5)
        echo ""
        echo "📚 Guías disponibles:"
        echo "1. Plan de Deployment: .gemini/antigravity/brain/implementation_plan.md"
        echo "2. Guía Paso a Paso: .gemini/antigravity/brain/walkthrough.md"
        ;;
    *)
        echo "Opción no válida"
        ;;
esac
