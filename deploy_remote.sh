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
echo "📦 1/6 جاري مزامنة الملفات والتعديلات مع السيرفر..."
sshpass -p "$SERVER_PASS" rsync -avz \
  --exclude 'node_modules' \
  --exclude 'client/node_modules' \
  --exclude 'server/node_modules' \
  --exclude 'whatsapp-system/node_modules' \
  --exclude 'client/dist' \
  --exclude 'server/uploads' \
  --exclude 'server/backups' \
  --exclude '.env' \
  -e "ssh -F /dev/null -o StrictHostKeyChecking=no" \
  ./ "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

# 3. Copy client, server and whatsapp .env files
echo "🔑 2/6 جاري نقل إعدادات البيئة (Client & Server .env)..."
if [ -f client/.env ]; then
  sshpass -p "$SERVER_PASS" scp -F /dev/null -o StrictHostKeyChecking=no client/.env "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/client/.env"
fi
if [ -f server/.env ]; then
  sshpass -p "$SERVER_PASS" scp -F /dev/null -o StrictHostKeyChecking=no server/.env "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/server/.env"
fi

# 4. Sync WhatsApp authenticated session
if [ -d whatsapp-system/auth_session ]; then
  echo "📲 3/6 نقل جلسة تسجيل دخول الواتساب الموثقة..."
  sshpass -p "$SERVER_PASS" ssh -F /dev/null -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_PATH/whatsapp-system/auth_session"
  sshpass -p "$SERVER_PASS" rsync -avz -e "ssh -F /dev/null -o StrictHostKeyChecking=no" whatsapp-system/auth_session/ "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/whatsapp-system/auth_session/"
fi

# 5. Remote Backup and Database Sync
echo "💾 4/6 جاري أخذ نسخة احتياطية من قاعدة بيانات السيرفر..."
sshpass -p "$SERVER_PASS" ssh -F /dev/null -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
  mkdir -p /home/atlas/backups && \
  docker exec atlas_postgres pg_dump -U postgres -d atlas_erp_local > /home/atlas/backups/pre_deploy_backup_\$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || true
"

# 6. Apply WhatsApp schema and tables to remote database
echo "🗄️  5/6 نقل وتطبيق جداول الواتساب والـ LID إلى قاعدة بيانات السيرفر..."
if [ -f /tmp/whatsapp_schema_data.sql ]; then
  sshpass -p "$SERVER_PASS" scp -F /dev/null -o StrictHostKeyChecking=no /tmp/whatsapp_schema_data.sql "$SERVER_USER@$SERVER_IP:/tmp/whatsapp_schema_data.sql"
  sshpass -p "$SERVER_PASS" ssh -F /dev/null -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
    docker exec -i atlas_postgres psql -U postgres -d atlas_erp_local < /tmp/whatsapp_schema_data.sql >/dev/null 2>&1 || true
    rm -f /tmp/whatsapp_schema_data.sql
  "
fi

# 7. Rebuild and restart containers
echo "🐳 6/6 جاري إعادة بناء وتشغيل الحاويات في السيرفر (Client, Server, DB, WhatsApp)..."
sshpass -p "$SERVER_PASS" ssh -F /dev/null -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
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
