-- ============================================================
-- Migration: 001_add_profile_fields_and_discounts.sql
-- Description: Adds persistent discounts to group_enrollments,
--              detailed fields to students and teachers,
--              and photo fields to users and teachers.
-- ============================================================

-- 1. Persistent Discount in Group Enrollments
ALTER TABLE group_enrollments
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00;

-- 2. Enhanced Fields for Students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS national_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 3. Enhanced Fields for Teachers
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS aka VARCHAR(100),
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS national_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS secretary_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 4. Photo field for Users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
