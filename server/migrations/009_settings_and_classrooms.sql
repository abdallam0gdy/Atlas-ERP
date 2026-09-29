-- ============================================================
-- Migration 009: Center Attendance Settings and Classrooms Enhancements
-- ============================================================

-- 1. Insert or update default attendance and schedule settings
INSERT INTO system_settings (key, value, value_type, category, label_ar, label_en) VALUES
  ('attendance_early_allowance_minutes', '30', 'number', 'attendance', 'وقت السماح بالحضور قبل الحصة (بالدقائق)', 'Early Attendance Allowance (Minutes)'),
  ('attendance_late_allowance_minutes', '30', 'number', 'attendance', 'وقت السماح بالحضور بعد انتهاء الحصة (بالدقائق)', 'Late Attendance Allowance (Minutes)'),
  ('multi_session_gap_minutes', '60', 'number', 'attendance', 'الحد الأقصى للفاصل بين الحصص المتتالية (بالدقائق)', 'Multi-Session Max Gap (Minutes)')
ON CONFLICT (key) DO UPDATE
  SET label_ar = EXCLUDED.label_ar,
      label_en = EXCLUDED.label_en,
      category = EXCLUDED.category;

-- 2. Update multi_session_gap_minutes to 60 if it was 30 or 75
UPDATE system_settings
SET value = '60'
WHERE key = 'multi_session_gap_minutes' AND value IN ('30', '75');

-- 3. Ensure classrooms table has proper indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_active ON classrooms(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_classroom ON groups(classroom_id);
