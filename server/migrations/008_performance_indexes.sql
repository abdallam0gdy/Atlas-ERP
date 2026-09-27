-- ========================================================
-- Migration 008: Performance Indexes for 500+ Students Scale
-- ========================================================

-- 1. Accelerate subscription lookups in gate scanning and absence processing
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_active_sessions 
ON student_subscriptions (student_id, status, remaining_sessions)
WHERE status = 'active';

-- 2. Accelerate group-specific subscription lookups
CREATE INDEX IF NOT EXISTS idx_student_subscriptions_group_active 
ON student_subscriptions (student_id, group_id, status)
WHERE status = 'active';

-- 3. Accelerate group enrollments queries
CREATE INDEX IF NOT EXISTS idx_group_enrollments_group_active 
ON group_enrollments (group_id, is_active)
WHERE is_active = true;

-- 4. Accelerate treasury transactions lookups
CREATE INDEX IF NOT EXISTS idx_treasury_transactions_reference 
ON treasury_transactions (reference_id)
WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treasury_transactions_created 
ON treasury_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_treasury_transactions_type 
ON treasury_transactions (transaction_type);

-- 5. Accelerate attendance logs lookup for today's queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_today 
ON attendance_logs (session_date, status, payment_status);
