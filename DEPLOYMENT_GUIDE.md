# 🚀 دليل التشغيل والرفع على سيرفر أطلس (Atlas ERP Server Deployment Guide)

> **مرجع دائم للبيئة السحابية وخادم الإنتاج (Production Server Reference)**

---

## 📌 1. بيانات السيرفر الأساسية (Server Credentials)

| البيان | القيمة | ملاحظات |
|---|---|---|
| **عنوان الآي بي (Tailscale IP)** | `100.70.7.7` | شبكة Tailscale الآمنة |
| **اسم المستخدم (SSH User)** | `atlas` | مستخدم بصلاحيات sudo ومجموعة docker |
| **كلمة المرور (Password)** | `admin` | لكل من SSH و Sudo |
| **مسار المشروع على السيرفر** | `/home/atlas/ERP_Sys` | مسار العمل لمستودع النظام |
| **مسار النسخ الاحتياطية** | `/home/atlas/backups` | نسخ دورية لقاعدة البيانات |

---

## 🐳 2. معمارية الحاويات (Docker Containers Architecture)

يتم تشغيل النظام داخل بيئة معزولة بالكامل عبر **Docker Compose** تتكون من 3 حاويات رئيسية بالإضافة إلى Portainer:

```
[ المتصفح / العميل ]
        │
        ▼ (Port 80)
┌─────────────────────────────────────────────────────────────┐
│ 1. atlas_client (Nginx 1.25 Alpine)                         │
│  - يخدم ملفات React 19 + Vite 8 المبنية مسبقاً (Production) │
│  - يحتوي على التوجيه الداخلي (SPA Fallback /try_files)      │
│  - وكيل عكسي (Reverse Proxy) لـ /api/ إلى atlas_server:5000  │
│  - وكيل عكسي لـ /uploads/ إلى atlas_server:5000/uploads      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ (Port 5000)
┌─────────────────────────────────────────────────────────────┐
│ 2. atlas_server (Node.js 20 Alpine)                         │
│  - خادم Express.js API                                      │
│  - معالجة ورفع وضغط الصور WebP عبر Sharp                     │
│  - المجلدات المربوطة (Volumes):                             │
│      server/uploads  --> /app/uploads                        │
│      server/backups  --> /app/backups                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼ (Port 5432)
┌─────────────────────────────────────────────────────────────┐
│ 3. atlas_postgres (PostgreSQL 16 Alpine)                    │
│  - محرك قاعدة البيانات الرسمي                               │
│  - التوقيت الافتراضي: Africa/Cairo                          │
│  - الفوليوم الدائم: erp_sys_pgdata                          │
│  - فحص الصحة الدوري: pg_isready                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 3. خطوات التحديث والرفع بضغطة زر (1-Command Sync & Deploy)

من جهازك المحلي (في مسار `/home/abdalla/projects/atlas/ERP_Sys`):

### الخطوة 1: مزامنة التعديلات عبر rsync
```bash
sshpass -p 'admin' rsync -avz \
  --exclude 'node_modules' \
  --exclude 'client/node_modules' \
  --exclude 'server/node_modules' \
  --exclude 'client/dist' \
  --exclude 'server/uploads' \
  --exclude 'server/backups' \
  --exclude '.env' \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./ atlas@100.70.7.7:/home/atlas/ERP_Sys/
```

### الخطوة 2: نسخ ملف البيئة للواجهة (إن وجد تعديل)
```bash
sshpass -p 'admin' scp -o StrictHostKeyChecking=no client/.env atlas@100.70.7.7:/home/atlas/ERP_Sys/client/.env
```

### الخطوة 3: أخذ نسخة احتياطية من قاعدة البيانات وبناء الحاويات
```bash
sshpass -p 'admin' ssh -o StrictHostKeyChecking=no atlas@100.70.7.7 "
  mkdir -p /home/atlas/backups && \
  docker exec atlas_postgres pg_dump -U postgres -d atlas_erp_local > /home/atlas/backups/pre_deploy_backup_\$(date +%Y%m%d_%H%M%S).sql && \
  cd /home/atlas/ERP_Sys && \
  docker compose up -d --build
"
```

---

## ⚠️ 4. ملاحظات تقنية هامة (Gotchas & Fixes)

1. **إعدادات DNS على السيرفر (Tailscale DNS Fix)**:
   - خادم Tailscale قد يعطل DNS الافتراضي في `/etc/resolv.conf`.
   - تم تثبيت DNS في `/etc/docker/daemon.json`:
     ```json
     {
       "dns": ["8.8.8.8", "1.1.1.1"]
     }
     ```
   - وتمت إضافة `nameserver 8.8.8.8` في بداية `/etc/resolv.conf` لضمان سرعة سحب الصور وبنائها.

2. **بناء الفرونت إند في دوكر (Vite Build Arguments)**:
   - يحتاج `vite build` إلى مفاتيح Supabase و ImgBB أثناء وقت الترجمة (Compile Time).
   - تم تمريرها تلقائياً عبر `docker-compose.yml` و `client/Dockerfile` كـ `ARG` و `ENV`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_IMGBB_API_KEY`
     - `VITE_API_BASE_URL`

3. **حماية مجلدات الميديا وقاعدة البيانات**:
   - مجلد `server/uploads` مستبعد تماماً من أي استبدال في Git أو rsync لضمان بقاء صور الطلاب والمدرسين.
   - قاعدة البيانات مخزنة في فوليوم خارجي `erp_sys_pgdata` ولا يتم مسحه عند عمل `docker compose down` أو `rebuild`.

---

## 🌐 5. الروابط التشغيلية المباشرة (Active Endpoints)

- **بوابة النظام الرئيسية**: [http://100.70.7.7](http://100.70.7.7)
- **فحص صحة الباك إند**: [http://100.70.7.7/api/health](http://100.70.7.7/api/health)
- **لوحة إدارة التسجيلات الإلكترونية**: [http://100.70.7.7/online-registrations](http://100.70.7.7/online-registrations)
- **تسجيل دخول الإدارة**: [http://100.70.7.7/atlas-admin](http://100.70.7.7/atlas-admin)
- **بوابة تسجيل الطلاب أونلاين**: [http://100.70.7.7/register/student](http://100.70.7.7/register/student)
- **بوابة تسجيل المعلمين أونلاين**: [http://100.70.7.7/register/teacher](http://100.70.7.7/register/teacher)
- **لوحة تحكم بورتينر (Portainer CE)**: [http://100.70.7.7:9000](http://100.70.7.7:9000)
