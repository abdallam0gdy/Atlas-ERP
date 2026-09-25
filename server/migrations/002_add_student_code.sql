-- ============================================================
-- Migration 002: Add Center-wide student_code sequence & column
-- ============================================================

-- Create a center-wide sequence for student codes starting at 1001
CREATE SEQUENCE IF NOT EXISTS student_code_seq START WITH 1001;

-- Add student_code to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS student_code INTEGER UNIQUE DEFAULT nextval('student_code_seq');

-- Index for instant lookup by student_code
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code);

-- Update barcode_batches and items if needed
ALTER TABLE barcode_batches
ADD COLUMN IF NOT EXISTS use_center_sequence BOOLEAN DEFAULT TRUE;
