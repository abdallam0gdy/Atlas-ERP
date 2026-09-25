-- ============================================================
-- Migration 005: Packages, Revenue Splits, Education Type, and Discounts
-- ============================================================

-- 1. Add education_type to students (PUBLIC = حكومي/عربي, LANGUAGES = لغات/تجريبي)
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS education_type VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';

-- 2. Add Revenue Splits to groups (Package default: 0% teacher / 100% center, Private default: 75% teacher / 25% center)
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS package_teacher_ratio NUMERIC(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS package_center_ratio NUMERIC(5,2) NOT NULL DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS private_teacher_ratio NUMERIC(5,2) NOT NULL DEFAULT 75.00,
ADD COLUMN IF NOT EXISTS private_center_ratio NUMERIC(5,2) NOT NULL DEFAULT 25.00;

-- 3. Add enrollment_type to group_enrollments (PACKAGE vs PRIVATE)
ALTER TABLE group_enrollments 
ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) NOT NULL DEFAULT 'PACKAGE';

-- 4. Add enrollment_type, discount_type and discount_value to student_subscriptions
ALTER TABLE student_subscriptions 
ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20) NOT NULL DEFAULT 'PACKAGE',
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'FIXED',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 5. Table for Grade Packages (منظومة باكدجات المراحل الدراسية)
CREATE TABLE IF NOT EXISTS grade_packages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(100) NOT NULL,
  grade_id             UUID NOT NULL REFERENCES academic_grades(id) ON DELETE CASCADE,
  education_type       VARCHAR(20) NOT NULL DEFAULT 'PUBLIC', -- 'PUBLIC' or 'LANGUAGES'
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

-- 6. Pre-seed default package records for all existing grades (both Public and Languages)
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
