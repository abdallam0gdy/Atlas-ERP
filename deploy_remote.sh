#!/usr/bin/env bash

# ============================================================
# Atlas ERP — Auto Deployment Script to 100.70.7.7
# ============================================================

set -e

SERVER_IP="${ATLAS_SERVER_IP:-100.70.7.7}"
SERVER_USER="${ATLAS_SERVER_USER:-atlas}"
SERVER_PASS="${ATLAS_SERVER_PASS:-admin}"
REMOTE_PATH="/home/atlas/ERP_Sys"

echo "══════════════════════════════════════════════════════════"
echo "   🚀 بدء نشر وتحديث نظام أطلس على السيرفر ($SERVER_IP)"
echo "══════════════════════════════════════════════════════════"

# 1. Check sshpass
if ! command -v sshpass &> /dev/null; then
    echo "❌ خطأ: أداة sshpass غير مثبتة محلياً!"
    echo "لتثبيتها قم بتشغيل: sudo apt install sshpass أو dnf install sshpass"
    exit 1
fi

# 2. Sync files to server
echo "📦 1/4 جاري مزامنة الملفات والتعديلات مع السيرفر..."
sshpass -p "$SERVER_PASS" rsync -avz \
  --exclude 'node_modules' \
  --exclude 'client/node_modules' \
  --exclude 'server/node_modules' \
  --exclude 'client/dist' \
  --exclude 'server/uploads' \
  --exclude 'server/backups' \
  --exclude '.env' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

# 3. Copy client and server .env
echo "🔑 2/4 جاري نقل إعدادات البيئة (Client & Server .env)..."
if [ -f client/.env ]; then
  sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no client/.env "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/client/.env"
fi
if [ -f server/.env ]; then
  sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no server/.env "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/server/.env"
fi

# 4. Remote Backup and Build
echo "💾 3/4 جاري أخذ نسخة احتياطية من قاعدة البيانات..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
  mkdir -p /home/atlas/backups && \
  docker exec atlas_postgres pg_dump -U postgres -d atlas_erp_local > /home/atlas/backups/pre_deploy_backup_\$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || true
"

echo "🐳 4/4 جاري إعادة بناء وتشغيل الحاويات في السيرفر..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
  cd $REMOTE_PATH && \
  docker compose up -d --build
"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ تم اكتمال النشر والتشغيل على السيرفر بنجاح!"
echo "══════════════════════════════════════════════════════════"
echo "🌐 رابط الدخول: http://$SERVER_IP"
echo "💚 فحص الصحة: http://$SERVER_IP/api/health"
echo "══════════════════════════════════════════════════════════"
