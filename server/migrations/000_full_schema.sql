-- ============================================================
-- Atlas Educational ERP — Master Consolidated Schema (DDL + Seeds)
-- Database: PostgreSQL 14+ (Tested on PostgreSQL 18)
-- File: 000_full_schema.sql
-- Date: 2026-09-25
-- Description: Unified single schema file containing all 27 tables,
--              enums, sequences, triggers, constraints, indexes,
--              and base seed data (No Cashier, Dynamic Roles/Allowed Pages).
-- ============================================================

-- Enable required cryptographic extension
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
-- 2. SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS student_code_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS booklet_reservation_seq START WITH 1001;

-- ============================================================
-- 3. UTILITY FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. TABLES & RELATIONS (27 TABLES)
-- ============================================================

-- 4.1 RBAC: Roles (أنواع الحسابات والأدوار)
CREATE TABLE IF NOT EXISTS roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) NOT NULL UNIQUE,
  label_ar      VARCHAR(100),
  label_en      VARCHAR(100),
  description   TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT TRUE,
  allowed_pages JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.2 RBAC: Permissions (صلاحيات النظام)
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50) NOT NULL,
  label_ar    VARCHAR(150),
  label_en    VARCHAR(150),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 RBAC: Role-Permissions Join Table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4.4 Users: موظفو ومستخدمو النظام
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  full_name_ar  VARCHAR(100),
  phone         VARCHAR(20),
  email         VARCHAR(100),
  role_id       UUID NOT NULL REFERENCES roles(id),
  photo_url     VARCHAR(500),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.5 Academic Grades (المراحل الدراسية)
CREATE TABLE IF NOT EXISTS academic_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100),
  grade_order INT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_academic_grades_updated_at
  BEFORE UPDATE ON academic_grades
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.6 Student Statuses (حالات الطلاب وخصوماتهم)
CREATE TABLE IF NOT EXISTS student_statuses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar          VARCHAR(50) NOT NULL,
  name_en          VARCHAR(50),
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  color            VARCHAR(20) DEFAULT '#0C3C82',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.7 Students: بيانات الطلاب
CREATE TABLE IF NOT EXISTS students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code    INTEGER UNIQUE DEFAULT nextval('student_code_seq'),
  barcode_id      VARCHAR(50) UNIQUE,
  full_name       VARCHAR(150) NOT NULL,
  phone           VARCHAR(20),
  parent_phone    VARCHAR(20),
  father_phone    VARCHAR(20),
  mother_phone    VARCHAR(20),
  parent_name     VARCHAR(150),
  gender          VARCHAR(10) DEFAULT 'male',
  national_id     VARCHAR(20),
  date_of_birth   DATE,
  grade_id        UUID NOT NULL REFERENCES academic_grades(id),
  status_id       UUID REFERENCES student_statuses(id),
  education_type  VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC' (حكومي/عربي) or 'LANGUAGES' (لغات/تجريبي)
  enrollment_type VARCHAR(20) NOT NULL DEFAULT 'PACKAGE', -- 'PACKAGE' or 'PRIVATE'
  school_name     VARCHAR(150),
  photo_url       VARCHAR(500),
  address         TEXT,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code);
CREATE INDEX IF NOT EXISTS idx_students_barcode ON students (barcode_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students (grade_id);

-- 4.8 Subjects: المواد الدراسية
CREATE TABLE IF NOT EXISTS subjects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar        VARCHAR(100) NOT NULL,
  name_en        VARCHAR(100),
  code           VARCHAR(20) NOT NULL UNIQUE,
  color          VARCHAR(20) DEFAULT '#0C3C82',
  education_type VARCHAR(20) DEFAULT 'general',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.9 Teachers: هيئة التدريس
CREATE TABLE IF NOT EXISTS teachers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            VARCHAR(150) NOT NULL,
  full_name_ar         VARCHAR(150),
  aka                  VARCHAR(100),
  phone                VARCHAR(20),
  email                VARCHAR(100),
  gender               VARCHAR(10) DEFAULT 'male',
  national_id          VARCHAR(20),
  specialization       VARCHAR(100),
  subject_id           UUID REFERENCES subjects(id),
  subject_ids          UUID[] DEFAULT '{}',
  revenue_split_percent NUMERIC(5,2) DEFAULT 0.00,
  revenue_split_type   VARCHAR(20) DEFAULT 'percentage',
  fixed_rate_per_student NUMERIC(10,2) DEFAULT 0.00,
  bio                  TEXT,
  social_links         JSONB DEFAULT '{}'::jsonb,
  secretary_name       VARCHAR(150),
  secretary_phone      VARCHAR(20),
  photo_url            VARCHAR(500),
  logo_url             VARCHAR(500),
  date_of_birth        DATE,
  notes                TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.10 Classrooms: القاعات
CREATE TABLE IF NOT EXISTS classrooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50) NOT NULL UNIQUE,
  name_ar    VARCHAR(50),
  capacity   INT NOT NULL DEFAULT 40,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11 Groups: المجموعات الدراسية
CREATE TABLE IF NOT EXISTS groups (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(100) NOT NULL,
  teacher_id            UUID NOT NULL REFERENCES teachers(id),
  subject_id            UUID NOT NULL REFERENCES subjects(id),
  grade_id              UUID NOT NULL REFERENCES academic_grades(id),
  classroom_id          UUID REFERENCES classrooms(id),
  status                group_status_enum NOT NULL DEFAULT 'active',
  billing_model         billing_model_enum NOT NULL DEFAULT 'PER_SUBJECT',
  price_per_month       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  price_per_session     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  schedule              JSONB,
  package_teacher_ratio NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  package_center_ratio  NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  private_teacher_ratio NUMERIC(5,2) NOT NULL DEFAULT 75.00,
  private_center_ratio  NUMERIC(5,2) NOT NULL DEFAULT 25.00,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.12 Group Enrollments: تسجيل الطلاب في المجموعات
CREATE TABLE IF NOT EXISTS group_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  enrollment_type VARCHAR(20) NOT NULL DEFAULT 'PACKAGE',
  discount_type   VARCHAR(10) NOT NULL DEFAULT 'FIXED',
  discount_value  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  notes           TEXT,
  UNIQUE (student_id, group_id)
);

-- 4.13 Student Subscriptions: اشتراكات الطلاب والحصص
CREATE TABLE IF NOT EXISTS student_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id        UUID REFERENCES groups(id) ON DELETE SET NULL,
  status          subscription_status_enum NOT NULL DEFAULT 'active',
  billing_month   VARCHAR(7) NOT NULL,
  total_sessions  INT NOT NULL DEFAULT 8,
  used_sessions   INT NOT NULL DEFAULT 0,
  amount_paid     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_status  payment_status_enum NOT NULL DEFAULT 'pending',
  enrollment_type VARCHAR(20) NOT NULL DEFAULT 'PACKAGE',
  discount_type   VARCHAR(10) NOT NULL DEFAULT 'FIXED',
  discount_value  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_student_subscriptions_updated_at
  BEFORE UPDATE ON student_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.14 Attendance Logs: سجل الحضور الذكي
CREATE TABLE IF NOT EXISTS attendance_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  scan_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status         attendance_status_enum NOT NULL DEFAULT 'present',
  payment_status payment_status_enum NOT NULL DEFAULT 'paid',
  scanned_by     UUID REFERENCES users(id),
  notes          TEXT,
  UNIQUE (student_id, group_id, session_date)
);

-- 4.15 Barcode Batches: دفعات الباركود
CREATE TABLE IF NOT EXISTS barcode_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name          VARCHAR(100) NOT NULL,
  grade_id            UUID REFERENCES academic_grades(id),
  start_sequence      INT NOT NULL,
  end_sequence        INT NOT NULL,
  status              batch_status_enum NOT NULL DEFAULT 'pending',
  use_center_sequence BOOLEAN DEFAULT TRUE,
  generated_by        UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.16 Barcode Items: عناصر الباركود المطبوعة
CREATE TABLE IF NOT EXISTS barcode_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES barcode_batches(id) ON DELETE CASCADE,
  barcode_value VARCHAR(50) NOT NULL UNIQUE,
  sequence_num  INT NOT NULL,
  status        barcode_item_status_enum NOT NULL DEFAULT 'unassigned',
  assigned_to   UUID REFERENCES students(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.17 Inventory Items: المخزن والملازم
CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  category        VARCHAR(50) NOT NULL DEFAULT 'booklet',
  barcode         VARCHAR(50) UNIQUE,
  subject_id      UUID REFERENCES subjects(id) ON DELETE SET NULL,
  grade_id        UUID REFERENCES academic_grades(id) ON DELETE SET NULL,
  teacher_id      UUID REFERENCES teachers(id) ON DELETE SET NULL,
  cost_price      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_stock   INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 5,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.18 Booklet Groups Link Table: ربط الملازم بالمجموعات
CREATE TABLE IF NOT EXISTS booklet_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_booklet_groups_item ON booklet_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_booklet_groups_group ON booklet_groups(group_id);

-- 4.19 Booklet Reservations: حجز وتسليم الملازم والكتب
CREATE TABLE IF NOT EXISTS booklet_reservations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number VARCHAR(30) UNIQUE NOT NULL,
  student_id         UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  item_id            UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  group_id           UUID REFERENCES groups(id) ON DELETE SET NULL,
  quantity           INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  paid_amount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_status     VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  delivery_status    VARCHAR(20) NOT NULL DEFAULT 'reserved',
  reserved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at       TIMESTAMPTZ,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_booklet_reservations_updated_at
  BEFORE UPDATE ON booklet_reservations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_booklet_res_student ON booklet_reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_booklet_res_item ON booklet_reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_booklet_res_status ON booklet_reservations(delivery_status);

-- 4.20 POS Sales: فواتير المبيعات ونقاط البيع
CREATE TABLE IF NOT EXISTS pos_sales (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  cashier_id     UUID NOT NULL REFERENCES users(id),
  student_id     UUID REFERENCES students(id) ON DELETE SET NULL,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  paid_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  change_amount  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.21 POS Sale Items: بنود فاتورة نقطة البيع
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id     UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES inventory_items(id),
  item_name   VARCHAR(150) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_cost   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 4.22 Expenses: المصروفات التشغيلية
CREATE TABLE IF NOT EXISTS expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_category VARCHAR(50) NOT NULL,
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  recipient_name   VARCHAR(100),
  notes            TEXT NOT NULL,
  voucher_no       VARCHAR(30),
  recorded_by      UUID NOT NULL REFERENCES users(id),
  expense_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.23 Treasury Transactions: سجل حركة النقدية والخزينة
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  reference_id     UUID,
  notes            TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.24 Daily Settlements: الإقفال اليومي وتقفيل الوردية
CREATE TABLE IF NOT EXISTS daily_settlements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id             UUID NOT NULL REFERENCES users(id),
  opening_balance     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_subscriptions NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_pos_sales     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_deposits      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_expenses      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  expected_cash       NUMERIC(10,2) NOT NULL,
  actual_cash         NUMERIC(10,2) NOT NULL,
  difference          NUMERIC(10,2) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'closed',
  notes               TEXT,
  closed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.25 Grade Packages: منظومة باكدجات المراحل الدراسية
CREATE TABLE IF NOT EXISTS grade_packages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(100) NOT NULL,
  grade_id             UUID NOT NULL REFERENCES academic_grades(id) ON DELETE CASCADE,
  education_type       VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  package_price        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  single_subject_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grade_id, education_type)
);

CREATE TRIGGER set_grade_packages_updated_at
  BEFORE UPDATE ON grade_packages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_grade_packages_grade ON grade_packages(grade_id);
CREATE INDEX IF NOT EXISTS idx_grade_packages_edu ON grade_packages(education_type);

-- 4.26 System Settings: إعدادات النظام العامة
CREATE TABLE IF NOT EXISTS system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  value_type  VARCHAR(20) NOT NULL DEFAULT 'string',
  category    VARCHAR(50) NOT NULL DEFAULT 'general',
  label_ar    VARCHAR(150),
  label_en    VARCHAR(150),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4.27 Audit Log: سجل تدقيق العمليات
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   VARCHAR(100),
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ============================================================
-- 5. INITIAL SEED DATA
-- ============================================================

-- 5.1 Roles (الأدوار الافتراضية مع صفحاتها المسموحة - بدون كاشير)
INSERT INTO roles (name, label_ar, label_en, description, is_system, allowed_pages) VALUES
  ('SUPER_ADMIN_OWNER', 'مالك النظام', 'Super Admin / Owner',
   'صلاحية كاملة لجميع أقسام وصفحات وإعدادات النظام', true,
   '["dashboard", "students", "teachers", "groups", "subjects", "subscriptions", "packages", "finance", "booklets", "qrcode", "gate", "users"]'::jsonb),
  
  ('CENTER_MANAGER', 'مدير السنتر', 'Center Manager',
   'إدارة المجموعات والمدرسين والطلاب والجداول والتشغيل العام', true,
   '["dashboard", "students", "teachers", "groups", "subjects", "subscriptions", "packages", "booklets", "qrcode", "gate"]'::jsonb),
  
  ('FINANCE_MANAGER', 'مدير المالية', 'Finance Manager',
   'إدارة الخزينة والمالية والاشتراكات والمصروفات والتقارير', true,
   '["dashboard", "students", "teachers", "groups", "subscriptions", "finance"]'::jsonb),
  
  ('RECEPTION_ASSISTANT', 'موظف الاستقبال', 'Reception Assistant',
   'تسجيل حضور الطلاب السريع، الكروت، ومكتب الملازم والاشتراكات', true,
   '["students", "subscriptions", "booklets", "gate"]'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET label_ar = EXCLUDED.label_ar,
    label_en = EXCLUDED.label_en,
    description = EXCLUDED.description,
    allowed_pages = EXCLUDED.allowed_pages;

-- 5.2 System Permissions (27 صلاحية أساسية)
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
  -- Settings & Users module
  ('settings.view',   'settings', 'عرض الإعدادات', 'View Settings'),
  ('settings.manage', 'settings', 'إدارة الإعدادات والحسابات', 'Manage Settings & Accounts'),
  -- Master data module
  ('master.view',   'master', 'عرض البيانات الأساسية', 'View Master Data'),
  ('master.manage', 'master', 'إدارة البيانات الأساسية', 'Manage Master Data'),
  -- Reports module
  ('reports.view',     'reports', 'عرض التقارير', 'View Reports'),
  ('reports.export',   'reports', 'تصدير التقارير', 'Export Reports')
ON CONFLICT (code) DO NOTHING;

-- 5.3 Role-Permission default mappings
-- SUPER_ADMIN_OWNER: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN_OWNER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CENTER_MANAGER: Most permissions except finance.manage and settings.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'CENTER_MANAGER'
  AND p.code NOT IN ('finance.manage', 'finance.settlements', 'settings.manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- FINANCE_MANAGER: Finance + views
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'FINANCE_MANAGER'
  AND (p.module = 'finance' OR p.code IN ('students.view', 'teachers.view', 'groups.view', 'attendance.view', 'reports.view', 'reports.export'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- RECEPTION_ASSISTANT: Scan attendance, student lookup & barcodes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'RECEPTION_ASSISTANT'
  AND p.code IN ('students.view', 'attendance.scan', 'attendance.view', 'barcodes.print', 'barcodes.assign')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5.4 Default Administrator user (User: admin / Pass: Atlas@2024)
INSERT INTO users (username, password_hash, full_name, full_name_ar, role_id)
SELECT 
  'admin',
  '$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi',
  'System Administrator',
  'مدير النظام (المالك)',
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

-- 5.6 Default Subjects (10 subjects)
INSERT INTO subjects (name_ar, name_en, code, color, education_type) VALUES
  ('اللغة العربية', 'Arabic', 'ARA', '#D8232A', 'general'),
  ('اللغة الإنجليزية', 'English', 'ENG', '#0C3C82', 'general'),
  ('الرياضيات', 'Mathematics', 'MTH', '#0EA5E9', 'general'),
  ('العلوم', 'Science', 'SCI', '#10B981', 'general'),
  ('الدراسات الاجتماعية', 'Social Studies', 'SOC', '#F59E0B', 'general'),
  ('اللغة الفرنسية', 'French', 'FRN', '#8B5CF6', 'general'),
  ('الفيزياء', 'Physics', 'PHY', '#06B6D4', 'general'),
  ('الكيمياء', 'Chemistry', 'CHM', '#EF4444', 'general'),
  ('الأحياء', 'Biology', 'BIO', '#22C55E', 'general'),
  ('الجيولوجيا', 'Geology', 'GEO', '#A855F7', 'general')
ON CONFLICT (code) DO NOTHING;

-- 5.7 Default Classrooms (15 rooms)
INSERT INTO classrooms (name, name_ar, capacity, is_active) VALUES
  ('Room 1', 'قاعة 1', 9999, true),
  ('Room 2', 'قاعة 2', 9999, true),
  ('Room 3', 'قاعة 3', 9999, true),
  ('Room 4', 'قاعة 4', 9999, true),
  ('Room 5', 'قاعة 5', 9999, true),
  ('Room 6', 'قاعة 6', 9999, true),
  ('Room 7', 'قاعة 7', 9999, true),
  ('Room 8', 'قاعة 8', 9999, true),
  ('Room 9', 'قاعة 9', 9999, true),
  ('Room 10', 'قاعة 10', 9999, true),
  ('Room 11', 'قاعة 11', 9999, true),
  ('Room 12', 'قاعة 12', 9999, true),
  ('Room 13', 'قاعة 13', 9999, true),
  ('Room 14', 'قاعة 14', 9999, true),
  ('Room 15', 'قاعة 15', 9999, true)
ON CONFLICT (name) DO UPDATE
SET name_ar = EXCLUDED.name_ar, capacity = 9999, is_active = true;

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

-- 5.10 Default Grade Packages (Public + Languages for all 12 grades)
INSERT INTO grade_packages (name, grade_id, education_type, package_price, single_subject_price)
SELECT 
  ag.name_ar || ' - حكومي / عربي',
  ag.id,
  'PUBLIC',
  CASE 
    WHEN ag.grade_order <= 6 THEN 300.00
    WHEN ag.grade_order <= 9 THEN 450.00
    ELSE 600.00
  END,
  CASE 
    WHEN ag.grade_order <= 6 THEN 70.00
    WHEN ag.grade_order <= 9 THEN 100.00
    ELSE 140.00
  END
FROM academic_grades ag
ON CONFLICT (grade_id, education_type) DO NOTHING;

INSERT INTO grade_packages (name, grade_id, education_type, package_price, single_subject_price)
SELECT 
  ag.name_ar || ' - لغات / تجريبي',
  ag.id,
  'LANGUAGES',
  CASE 
    WHEN ag.grade_order <= 6 THEN 400.00
    WHEN ag.grade_order <= 9 THEN 550.00
    ELSE 750.00
  END,
  CASE 
    WHEN ag.grade_order <= 6 THEN 90.00
    WHEN ag.grade_order <= 9 THEN 120.00
    ELSE 160.00
  END
FROM academic_grades ag
ON CONFLICT (grade_id, education_type) DO NOTHING;

-- 5.11 Sample Inventory Items
INSERT INTO inventory_items (name, category, barcode, cost_price, selling_price, current_stock, min_stock_alert)
VALUES
  ('ملزمة الفيزياء - الباب الأول (الكهربية)', 'booklet', 'ITM-PHYS-01', 25.00, 45.00, 50, 10),
  ('ملزمة الكيمياء - الباب الثاني (التحليل)', 'booklet', 'ITM-CHEM-02', 20.00, 40.00, 35, 10),
  ('كشكول سلك أطلس 100 ورقة', 'supply', 'ITM-NOTE-100', 18.00, 30.00, 80, 15),
  ('كارت حضور ذكي بديل (QR)', 'card', 'ITM-CARD-REP', 5.00, 20.00, 100, 20),
  ('قلم جاف أزرق روترنج', 'supply', 'ITM-PEN-BLUE', 4.00, 8.00, 60, 10)
ON CONFLICT (barcode) DO NOTHING;

-- 5.12 Package Groups & Enrollments
CREATE TABLE IF NOT EXISTS package_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES grade_packages(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT package_groups_unique UNIQUE(package_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_pkg_groups_pkg ON package_groups(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_groups_grp ON package_groups(group_id);

CREATE TABLE IF NOT EXISTS student_package_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES grade_packages(id) ON DELETE CASCADE,
    selected_group_ids UUID[] NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_student_pkg_student ON student_package_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_pkg_package ON student_package_enrollments(package_id);

-- ============================================================
-- 6. VERIFICATION BLOCK
-- ============================================================
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '✅ Unified Atlas ERP Schema applied successfully! Total tables: %', table_count;
END $$;
