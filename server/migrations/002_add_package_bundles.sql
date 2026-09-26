-- ============================================================
-- Migration: 002_add_package_bundles.sql
-- Description: Package groups junction & student package enrollments
-- ============================================================

-- 1. Package Groups (M:N linking grade_packages to candidate groups)
CREATE TABLE IF NOT EXISTS package_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES grade_packages(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT package_groups_unique UNIQUE(package_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_pkg_groups_pkg ON package_groups(package_id);
CREATE INDEX IF NOT EXISTS idx_pkg_groups_grp ON package_groups(group_id);

-- 2. Student Package Enrollments
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
