#!/usr/bin/env bash

# ============================================================
# Atlas ERP — Automated Database Backup Script
# Place in crontab to run daily (e.g. at 2:00 AM)
# 0 2 * * * /path/to/ERP_Sys/server/scripts/backup_cron.sh
# ============================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/atlas_erp}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/atlas_backup_$TIMESTAMP.sql"

echo "💾 Creating daily database backup: $BACKUP_FILE ..."
docker exec atlas_postgres pg_dump -U postgres -d atlas_erp_local > "$BACKUP_FILE"

# Compress backup
gzip -f "$BACKUP_FILE"

# Keep last 30 days of backups, purge older
find "$BACKUP_DIR" -type f -name "atlas_backup_*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed successfully: ${BACKUP_FILE}.gz"
