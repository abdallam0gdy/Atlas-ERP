-- 007_cancelled_sessions.sql
-- Table to track cancelled sessions (e.g. teacher apologies, holidays)
-- Ensures students are NOT marked absent or deducted for cancelled classes.

CREATE TABLE IF NOT EXISTS cancelled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  reason TEXT NOT NULL DEFAULT 'اعتذار المدرس',
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, session_date)
);

CREATE INDEX IF NOT EXISTS idx_cancelled_sessions_date ON cancelled_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_cancelled_sessions_group ON cancelled_sessions(group_id);
