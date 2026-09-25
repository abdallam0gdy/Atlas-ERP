-- ============================================================
-- Migration 003: Finance, Debts, POS, Inventory, and Subjects
-- ============================================================

-- 1. Upgrade subjects table with education_type
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS education_type VARCHAR(20) DEFAULT 'general';

-- Update initial subjects with reasonable defaults
UPDATE subjects SET education_type = 'general' WHERE education_type IS NULL;

-- 2. Inventory Items (المخزن: ملازم، كتب، كروت، أدوات)
CREATE TABLE IF NOT EXISTS inventory_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(150) NOT NULL,
  category         VARCHAR(50) NOT NULL DEFAULT 'booklet', -- booklet, book, card, supply, other
  barcode          VARCHAR(50) UNIQUE,
  subject_id       UUID REFERENCES subjects(id) ON DELETE SET NULL,
  grade_id         UUID REFERENCES academic_grades(id) ON DELETE SET NULL,
  cost_price       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  current_stock    INT NOT NULL DEFAULT 0,
  min_stock_alert  INT NOT NULL DEFAULT 5,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 3. POS Sales (فواتير نقاط البيع والكاشير)
CREATE TABLE IF NOT EXISTS pos_sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   VARCHAR(30) UNIQUE NOT NULL,
  cashier_id       UUID NOT NULL REFERENCES users(id),
  student_id       UUID REFERENCES students(id) ON DELETE SET NULL,
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  paid_amount      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  change_amount    NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_method   VARCHAR(20) NOT NULL DEFAULT 'cash',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. POS Sale Items (بنود الفاتورة)
CREATE TABLE IF NOT EXISTS pos_sale_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id          UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  item_id          UUID NOT NULL REFERENCES inventory_items(id),
  item_name        VARCHAR(150) NOT NULL,
  quantity         INT NOT NULL CHECK (quantity > 0),
  unit_cost        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  unit_price       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price      NUMERIC(10,2) NOT NULL DEFAULT 0.00
);

-- 5. Operational Expenses (المصروفات التشغيلية)
CREATE TABLE IF NOT EXISTS expenses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_category VARCHAR(50) NOT NULL, -- rent, electricity, hospitality, supplies, salary, maintenance, other
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  recipient_name   VARCHAR(100),
  notes            TEXT NOT NULL,
  voucher_no       VARCHAR(30),
  recorded_by      UUID NOT NULL REFERENCES users(id),
  expense_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Integrated Treasury Transactions (سجل الخزينة وحركة النقدية)
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(30) NOT NULL, -- opening_float, subscription_fee, pos_sale, manual_deposit, expense, withdrawal
  amount           NUMERIC(10,2) NOT NULL, -- positive for inflows, negative for outflows
  reference_id     UUID,
  notes            TEXT,
  recorded_by      UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Daily Settlements (تقفيل الوردية والإقفال اليومي)
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

-- 8. Seed sample inventory items if table is empty
INSERT INTO inventory_items (name, category, barcode, cost_price, selling_price, current_stock, min_stock_alert)
VALUES
  ('ملزمة الفيزياء - الباب الأول (الكهربية)', 'booklet', 'ITM-PHYS-01', 25.00, 45.00, 50, 10),
  ('ملزمة الكيمياء - الباب الثاني (التحليل)', 'booklet', 'ITM-CHEM-02', 20.00, 40.00, 35, 10),
  ('كشكول سلك أطلس 100 ورقة', 'supply', 'ITM-NOTE-100', 18.00, 30.00, 80, 15),
  ('كارت حضور ذكي بديل (QR)', 'card', 'ITM-CARD-REP', 5.00, 20.00, 100, 20),
  ('قلم جاف أزرق روترنج', 'supply', 'ITM-PEN-BLUE', 4.00, 8.00, 60, 10)
ON CONFLICT (barcode) DO NOTHING;
