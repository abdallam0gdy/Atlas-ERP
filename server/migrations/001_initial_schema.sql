-- ============================================================
-- Atlas Educational ERP — Phase 1 DDL Migration
-- Database: atlas_erp_local (PostgreSQL 18)
-- Date: 2026-09-15
-- Description: Complete schema for local-first educational ERP
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE billing_model_enum AS ENUM ('PACKAGE_BUNDLE', 'PER_SUBJECT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('paid', 'pending', 'free');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE barcode_item_status_enum AS ENUM ('unassigned', 'assigned', 'damaged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('active', 'expired', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE batch_status_enum AS ENUM ('pending', 'generated', 'partially_assigned', 'fully_assigned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE group_status_enum AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE day_of_week_enum AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. UTILITY: Auto-update updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. TABLES
-- ============================================================

-- ----------------------------------------------------------
-- 3.1 RBAC: Roles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  label_ar    VARCHAR(100),
  label_en    VARCHAR(100),
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.2 RBAC: Permissions
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50) NOT NULL,
  label_ar    VARCHAR(150),
  label_en    VARCHAR(150),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 3.3 RBAC: Role ↔ Permission mapping
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ----------------------------------------------------------
-- 3.4 Users (Center Staff)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(50) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  full_name_ar    VARCHAR(150),
  phone           VARCHAR(20),
  email           VARCHAR(100),
  role_id         UUID NOT NULL REFERENCES roles(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  -- Future online sync support
  sync_status     VARCHAR(20) DEFAULT 'local',
  remote_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.5 Academic Grades (المراحل الدراسية)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100),
  grade_order SMALLINT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sync_status VARCHAR(20) DEFAULT 'local',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_academic_grades_updated_at
  BEFORE UPDATE ON academic_grades
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.6 Subjects (المواد الدراسية)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100),
  code        VARCHAR(20) UNIQUE,
  color       VARCHAR(7) DEFAULT '#0C3C82',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sync_status VARCHAR(20) DEFAULT 'local',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.7 Classrooms (القاعات)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS classrooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) NOT NULL UNIQUE,
  name_ar     VARCHAR(100),
  capacity    SMALLINT DEFAULT 30,
  floor       SMALLINT DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sync_status VARCHAR(20) DEFAULT 'local',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.8 Student Statuses (حالات الطلاب + نسبة الخصم)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_statuses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar          VARCHAR(100) NOT NULL,
  name_en          VARCHAR(100),
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  color            VARCHAR(7) DEFAULT '#0C3C82',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_student_statuses_updated_at
  BEFORE UPDATE ON student_statuses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.9 Teachers (المدرسين)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             VARCHAR(150) NOT NULL,
  full_name_ar          VARCHAR(150),
  phone                 VARCHAR(20),
  email                 VARCHAR(100),
  specialization        VARCHAR(100),
  -- Revenue split configuration
  revenue_split_percent NUMERIC(5,2) DEFAULT 0.00,
  revenue_split_type    VARCHAR(20) DEFAULT 'percentage',
  fixed_rate_per_student NUMERIC(10,2) DEFAULT 0.00,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  notes                 TEXT,
  sync_status           VARCHAR(20) DEFAULT 'local',
  remote_id             UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.10 Groups (المجموعات)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  name_ar       VARCHAR(100),
  teacher_id    UUID NOT NULL REFERENCES teachers(id),
  subject_id    UUID NOT NULL REFERENCES subjects(id),
  grade_id      UUID NOT NULL REFERENCES academic_grades(id),
  classroom_id  UUID REFERENCES classrooms(id),
  -- Weekly schedule stored as JSON array
  -- Example: [{"day": "sunday", "start_time": "17:00", "end_time": "18:30"}]
  schedule      JSONB NOT NULL DEFAULT '[]'::jsonb,
  price_per_month   NUMERIC(10,2) DEFAULT 0.00,
  price_per_session NUMERIC(10,2) DEFAULT 0.00,
  max_students  SMALLINT DEFAULT 30,
  status        group_status_enum NOT NULL DEFAULT 'active',
  sync_status   VARCHAR(20) DEFAULT 'local',
  remote_id     UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.11 Students (الطلاب)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_id      VARCHAR(30) NOT NULL UNIQUE,
  full_name       VARCHAR(150) NOT NULL,
  full_name_ar    VARCHAR(150),
  phone           VARCHAR(20),
  parent_phone    VARCHAR(20),
  parent_name     VARCHAR(150),
  grade_id        UUID NOT NULL REFERENCES academic_grades(id),
  status_id       UUID REFERENCES student_statuses(id),
  billing_model   billing_model_enum NOT NULL DEFAULT 'PACKAGE_BUNDLE',
  photo_url       VARCHAR(500),
  address         TEXT,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Future online sync support
  sync_status     VARCHAR(20) DEFAULT 'local',
  remote_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.12 Group Enrollments (تسجيل الطلاب في المجموعات)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  notes         TEXT,
  sync_status   VARCHAR(20) DEFAULT 'local',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, group_id)
);

CREATE TRIGGER set_group_enrollments_updated_at
  BEFORE UPDATE ON group_enrollments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.13 Student Subscriptions (الاشتراكات الشهرية)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id            UUID REFERENCES groups(id),
  -- For PACKAGE_BUNDLE: total sessions in package
  -- For PER_SUBJECT: sessions per subject per month
  total_sessions      SMALLINT NOT NULL DEFAULT 0,
  used_sessions       SMALLINT NOT NULL DEFAULT 0,
  remaining_sessions  SMALLINT GENERATED ALWAYS AS (total_sessions - used_sessions) STORED,
  amount_paid         NUMERIC(10,2) DEFAULT 0.00,
  amount_due          NUMERIC(10,2) DEFAULT 0.00,
  billing_month       VARCHAR(7) NOT NULL,
  status              subscription_status_enum NOT NULL DEFAULT 'active',
  starts_at           DATE,
  expires_at          DATE,
  notes               TEXT,
  sync_status         VARCHAR(20) DEFAULT 'local',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_student_subscriptions_updated_at
  BEFORE UPDATE ON student_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.14 Barcode Batches (مخزون الباركود)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS barcode_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name      VARCHAR(100) NOT NULL,
  prefix          VARCHAR(20) NOT NULL DEFAULT 'ATL',
  grade_id        UUID REFERENCES academic_grades(id),
  start_sequence  INTEGER NOT NULL,
  end_sequence    INTEGER NOT NULL,
  total_count     INTEGER GENERATED ALWAYS AS (end_sequence - start_sequence + 1) STORED,
  assigned_count  INTEGER NOT NULL DEFAULT 0,
  status          batch_status_enum NOT NULL DEFAULT 'pending',
  generated_by    UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_barcode_batches_updated_at
  BEFORE UPDATE ON barcode_batches
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ----------------------------------------------------------
-- 3.15 Barcode Items (العناصر الفردية لكل دفعة)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS barcode_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES barcode_batches(id) ON DELETE CASCADE,
  barcode_value VARCHAR(30) NOT NULL UNIQUE,
  status        barcode_item_status_enum NOT NULL DEFAULT 'unassigned',
  assigned_to   UUID REFERENCES students(id),
  assigned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 3.16 Attendance Logs (سجل الحضور الذكي)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id),
  group_id          UUID NOT NULL REFERENCES groups(id),
  session_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            attendance_status_enum NOT NULL DEFAULT 'present',
  billing_type      billing_model_enum,
  payment_status    payment_status_enum NOT NULL DEFAULT 'pending',
  subscription_id   UUID REFERENCES student_subscriptions(id),
  scanned_by_user_id UUID REFERENCES users(id),
  notes             TEXT,
  sync_status       VARCHAR(20) DEFAULT 'local',
  remote_id         UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate scans for same student-group-date
  UNIQUE(student_id, group_id, session_date)
);

-- ----------------------------------------------------------
-- 3.17 Audit Log (سجل التدقيق)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  action        VARCHAR(50) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 3.18 System Settings (إعدادات النظام)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  value_type  VARCHAR(20) DEFAULT 'string',
  category    VARCHAR(50) DEFAULT 'general',
  label_ar    VARCHAR(150),
  label_en    VARCHAR(150),
  is_public   BOOLEAN DEFAULT FALSE,
  updated_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- 4. INDEXES (Performance-Critical)
-- ============================================================

-- Students: fast barcode lookup (already UNIQUE, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_students_barcode_id ON students(barcode_id);
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_parent_phone ON students(parent_phone);
CREATE INDEX IF NOT EXISTS idx_students_grade_id ON students(grade_id);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- Attendance: fast daily lookups
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_group_id ON attendance_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_date ON attendance_logs(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_scan_timestamp ON attendance_logs(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_date_group ON attendance_logs(session_date, group_id);

-- Group enrollments: fast student-group lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON group_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_group_id ON group_enrollments(group_id);

-- Subscriptions: billing lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id ON student_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_month ON student_subscriptions(billing_month);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON student_subscriptions(status);

-- Barcode items: fast lookup
CREATE INDEX IF NOT EXISTS idx_barcode_items_barcode_value ON barcode_items(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcode_items_status ON barcode_items(status);
CREATE INDEX IF NOT EXISTS idx_barcode_items_batch_id ON barcode_items(batch_id);

-- Audit log: entity lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Groups: teacher/subject lookups
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_subject_id ON groups(subject_id);
CREATE INDEX IF NOT EXISTS idx_groups_grade_id ON groups(grade_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- 5.1 Roles (5 RBAC roles)
INSERT INTO roles (name, label_ar, label_en, description) VALUES
  ('SUPER_ADMIN_OWNER', 'مالك النظام', 'Super Admin / Owner', 'Full unrestricted access — Finances, Settings, Profit split'),
  ('CENTER_MANAGER', 'مدير السنتر', 'Center Manager', 'Schedules, Teachers, Students, General Operations & Reports'),
  ('FINANCE_MANAGER', 'مدير المالية', 'Finance Manager', 'Treasury, Teacher Settlements, POS Ledger, End-of-Day Closures'),
  ('CASHIER', 'أمين الصندوق', 'Cashier', 'Subscription renewals, Student payments, Package sales, Receipts'),
  ('RECEPTION_ASSISTANT', 'مساعد الاستقبال', 'Reception Assistant', 'Smart Attendance Gate scanning ONLY, Fast student lookup')
ON CONFLICT (name) DO NOTHING;

-- 5.2 Permissions
INSERT INTO permissions (code, module, label_ar, label_en) VALUES
  -- Students module
  ('students.view',   'students', 'عرض الطلاب', 'View Students'),
  ('students.create', 'students', 'إضافة طالب', 'Create Student'),
  ('students.edit',   'students', 'تعديل طالب', 'Edit Student'),
  ('students.delete', 'students', 'حذف طالب', 'Delete Student'),
  -- Teachers module
  ('teachers.view',   'teachers', 'عرض المدرسين', 'View Teachers'),
  ('teachers.create', 'teachers', 'إضافة مدرس', 'Create Teacher'),
  ('teachers.edit',   'teachers', 'تعديل مدرس', 'Edit Teacher'),
  ('teachers.delete', 'teachers', 'حذف مدرس', 'Delete Teacher'),
  -- Groups module
  ('groups.view',   'groups', 'عرض المجموعات', 'View Groups'),
  ('groups.create', 'groups', 'إنشاء مجموعة', 'Create Group'),
  ('groups.edit',   'groups', 'تعديل مجموعة', 'Edit Group'),
  ('groups.delete', 'groups', 'حذف مجموعة', 'Delete Group'),
  -- Attendance module
  ('attendance.scan',  'attendance', 'تسجيل حضور', 'Scan Attendance'),
  ('attendance.view',  'attendance', 'عرض الحضور', 'View Attendance'),
  ('attendance.edit',  'attendance', 'تعديل حضور', 'Edit Attendance'),
  -- Barcode module
  ('barcodes.generate', 'barcodes', 'توليد باركود', 'Generate Barcodes'),
  ('barcodes.assign',   'barcodes', 'ربط باركود', 'Assign Barcode'),
  ('barcodes.print',    'barcodes', 'طباعة باركود', 'Print Barcode'),
  -- Finance module
  ('finance.view',       'finance', 'عرض المالية', 'View Finance'),
  ('finance.manage',     'finance', 'إدارة المالية', 'Manage Finance'),
  ('finance.settlements','finance', 'تسويات المدرسين', 'Teacher Settlements'),
  -- Settings module
  ('settings.view',   'settings', 'عرض الإعدادات', 'View Settings'),
  ('settings.manage', 'settings', 'إدارة الإعدادات', 'Manage Settings'),
  -- Master data module
  ('master.view',   'master', 'عرض البيانات الأساسية', 'View Master Data'),
  ('master.manage', 'master', 'إدارة البيانات الأساسية', 'Manage Master Data'),
  -- Reports module
  ('reports.view',     'reports', 'عرض التقارير', 'View Reports'),
  ('reports.export',   'reports', 'تصدير التقارير', 'Export Reports')
ON CONFLICT (code) DO NOTHING;

-- 5.3 Role-Permission assignments
-- SUPER_ADMIN_OWNER gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN_OWNER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CENTER_MANAGER gets most except finance.manage and settings.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'CENTER_MANAGER'
  AND p.code NOT IN ('finance.manage', 'finance.settlements', 'settings.manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- FINANCE_MANAGER gets finance + view permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'FINANCE_MANAGER'
  AND (p.module = 'finance' OR p.code IN ('students.view', 'teachers.view', 'groups.view', 'attendance.view', 'reports.view', 'reports.export'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CASHIER gets payment-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'CASHIER'
  AND p.code IN ('students.view', 'attendance.scan', 'attendance.view', 'barcodes.print', 'barcodes.assign', 'finance.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- RECEPTION_ASSISTANT gets scan-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'RECEPTION_ASSISTANT'
  AND p.code IN ('students.view', 'attendance.scan', 'attendance.view', 'barcodes.print', 'barcodes.assign')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5.4 Default Super Admin user (password: Atlas@2024)
-- bcrypt hash for 'Atlas@2024' with 10 rounds
INSERT INTO users (username, password_hash, full_name, full_name_ar, role_id)
SELECT 
  'admin',
  '$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi',
  'System Administrator',
  'مدير النظام',
  r.id
FROM roles r WHERE r.name = 'SUPER_ADMIN_OWNER'
ON CONFLICT (username) DO NOTHING;

-- 5.5 Academic Grades (12 grades)
INSERT INTO academic_grades (name_ar, name_en, grade_order) VALUES
  ('الصف الأول الابتدائي', 'Grade 1', 1),
  ('الصف الثاني الابتدائي', 'Grade 2', 2),
  ('الصف الثالث الابتدائي', 'Grade 3', 3),
  ('الصف الرابع الابتدائي', 'Grade 4', 4),
  ('الصف الخامس الابتدائي', 'Grade 5', 5),
  ('الصف السادس الابتدائي', 'Grade 6', 6),
  ('الصف الأول الإعدادي', 'Grade 7', 7),
  ('الصف الثاني الإعدادي', 'Grade 8', 8),
  ('الصف الثالث الإعدادي', 'Grade 9', 9),
  ('الصف الأول الثانوي', 'Grade 10', 10),
  ('الصف الثاني الثانوي', 'Grade 11', 11),
  ('الصف الثالث الثانوي', 'Grade 12', 12)
ON CONFLICT (grade_order) DO NOTHING;

-- 5.6 Default Subjects
INSERT INTO subjects (name_ar, name_en, code, color) VALUES
  ('اللغة العربية', 'Arabic', 'ARA', '#D8232A'),
  ('اللغة الإنجليزية', 'English', 'ENG', '#0C3C82'),
  ('الرياضيات', 'Mathematics', 'MTH', '#0EA5E9'),
  ('العلوم', 'Science', 'SCI', '#10B981'),
  ('الدراسات الاجتماعية', 'Social Studies', 'SOC', '#F59E0B'),
  ('اللغة الفرنسية', 'French', 'FRN', '#8B5CF6'),
  ('الفيزياء', 'Physics', 'PHY', '#06B6D4'),
  ('الكيمياء', 'Chemistry', 'CHM', '#EF4444'),
  ('الأحياء', 'Biology', 'BIO', '#22C55E'),
  ('الجيولوجيا', 'Geology', 'GEO', '#A855F7')
ON CONFLICT (code) DO NOTHING;

-- 5.7 Default Classrooms
INSERT INTO classrooms (name, name_ar, capacity) VALUES
  ('Room A', 'قاعة أ', 40),
  ('Room B', 'قاعة ب', 35),
  ('Room C', 'قاعة ج', 30),
  ('Room D', 'قاعة د', 25),
  ('Room E', 'قاعة هـ', 20)
ON CONFLICT (name) DO NOTHING;

-- 5.8 Default Student Statuses
INSERT INTO student_statuses (name_ar, name_en, discount_percent, color) VALUES
  ('عادي', 'Regular', 0.00, '#0C3C82'),
  ('متفوق', 'Distinguished', 10.00, '#10B981'),
  ('يتيم', 'Orphan', 50.00, '#F59E0B'),
  ('حالة خاصة', 'Special Case', 25.00, '#8B5CF6'),
  ('ابن موظف', 'Staff Child', 100.00, '#0EA5E9')
ON CONFLICT DO NOTHING;

-- 5.9 Default System Settings
INSERT INTO system_settings (key, value, value_type, category, label_ar, label_en) VALUES
  ('center_name', 'سنتر أطلس', 'string', 'general', 'اسم السنتر', 'Center Name'),
  ('center_name_en', 'Atlas Center', 'string', 'general', 'اسم السنتر بالإنجليزية', 'Center Name (English)'),
  ('barcode_prefix', 'ATL', 'string', 'barcode', 'بادئة الباركود', 'Barcode Prefix'),
  ('barcode_pattern', 'ATL-G{grade}-{seq}', 'string', 'barcode', 'نمط الباركود', 'Barcode Pattern'),
  ('session_duration_minutes', '90', 'number', 'schedule', 'مدة الحصة بالدقائق', 'Session Duration (Minutes)'),
  ('multi_session_gap_minutes', '30', 'number', 'attendance', 'الفاصل بين الحصص المتتالية', 'Multi-Session Gap (Minutes)'),
  ('attendance_debounce_ms', '300', 'number', 'attendance', 'مدة منع التكرار بالميللي ثانية', 'Attendance Debounce (ms)'),
  ('thermal_sticker_width_mm', '50', 'number', 'printing', 'عرض الملصق', 'Sticker Width (mm)'),
  ('thermal_sticker_height_mm', '25', 'number', 'printing', 'ارتفاع الملصق', 'Sticker Height (mm)'),
  ('default_package_sessions', '8', 'number', 'billing', 'عدد الحصص الافتراضي في الباقة', 'Default Package Sessions'),
  ('currency', 'EGP', 'string', 'billing', 'العملة', 'Currency'),
  ('sync_enabled', 'false', 'boolean', 'sync', 'تفعيل المزامنة', 'Enable Sync'),
  ('sync_remote_url', '', 'string', 'sync', 'عنوان السيرفر البعيد', 'Remote Server URL')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 6. VERIFICATION QUERY
-- ============================================================
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '✅ Atlas ERP Schema created successfully! Total tables: %', table_count;
END $$;
