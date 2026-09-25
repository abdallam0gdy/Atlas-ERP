-- ============================================================
-- Migration 004: 15 Classrooms, Booklet Teacher/Group Links, and Booklet Reservations
-- ============================================================

-- 1. Upgrade / Seed 15 Classrooms (قاعة 1 إلى قاعة 15) with infinite capacity (9999)
INSERT INTO classrooms (name, name_ar, capacity, is_active)
VALUES
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

-- 2. Link inventory_items to teacher
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;

-- 3. Link booklets to specific available groups
CREATE TABLE IF NOT EXISTS booklet_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_booklet_groups_item ON booklet_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_booklet_groups_group ON booklet_groups(group_id);

-- 4. Booklet Reservations & Deliveries Table (حجز واستلام الملازم والكتب)
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
  payment_status     VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- unpaid, partial, paid
  delivery_status    VARCHAR(20) NOT NULL DEFAULT 'reserved', -- reserved (محجوزة), delivered (تم الاستلام), cancelled (ملغية)
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

-- 5. Sequence for Booklet Reservation Number
CREATE SEQUENCE IF NOT EXISTS booklet_reservation_seq START WITH 1001;
