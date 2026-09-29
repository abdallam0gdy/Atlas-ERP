#!/usr/bin/env bash

# ============================================================
# Atlas Educational ERP — 1-Click Deployment Script
# ============================================================

set -e

echo "══════════════════════════════════════════════════════════"
echo "   🏛️  Atlas Educational ERP — بدء تشغيل وتثبيت النظام"
echo "══════════════════════════════════════════════════════════"

# 1. Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ خطأ: Docker غير مثبت على السيرفر!"
    echo "لتثبيته على Ubuntu قم بتشغيل:"
    echo "  curl -fsSL https://get.docker.com | sh"
    echo "  sudo usermod -aG docker \$USER"
    exit 1
fi

# 2. Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ خطأ: Docker Compose غير مثبت!"
    exit 1
fi

# 3. Environment configuration
if [ ! -f .env ]; then
    echo "⚙️  إنشاء ملف الإعدادات .env من .env.example..."
    cp .env.example .env
fi

# 4. Prepare local folders
mkdir -p server/uploads server/backups

# 5. Build and launch containers
echo "🚀 جاري بناء وتشغيل الحاويات في الخلفية (Docker Containers)..."
docker compose up -d --build

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ تم تشغيل نظام Atlas ERP بنجاح!"
echo "══════════════════════════════════════════════════════════"
echo "🌐 رابط الدخول من أي جهاز في شبكة السنتر:"
echo "   http://192.168.1.5"
echo ""
echo "📊 لمتابعة سجلات التشغيل (Logs):"
echo "   docker compose logs -f"
echo ""
echo "🛑 لإيقاف النظام:"
echo "   docker compose down"
echo "══════════════════════════════════════════════════════════"
