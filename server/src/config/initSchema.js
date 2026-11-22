const db = require('./db');

/**
 * Ensures all required columns for flexible monthly/bi-weekly group sessions
 * and day-based / monthly package subscriptions exist in PostgreSQL.
 */
async function ensureAccountingSchema() {
  try {
    // 1. Add sessions_per_month to groups (default 4, supports 2 for bi-weekly "أسبوع اه وأسبوع لا", 8 for twice weekly, etc.)
    await db.query(`
      ALTER TABLE groups
      ADD COLUMN IF NOT EXISTS sessions_per_month INTEGER NOT NULL DEFAULT 4;
    `);

    // 2. Add time-based (start_date, end_date, duration_days) and financial tracking columns to student_package_enrollments
    await db.query(`
      ALTER TABLE student_package_enrollments
      ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT (CURRENT_DATE + INTERVAL '29 days')::date,
      ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 30,
      ADD COLUMN IF NOT EXISTS gross_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) NOT NULL DEFAULT 'FIXED',
      ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS amount_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS billing_month VARCHAR(7);
    `);

    // 3. Backfill existing student_package_enrollments rows if needed
    await db.query(`
      UPDATE student_package_enrollments
      SET start_date = COALESCE(start_date, enrolled_at::date, CURRENT_DATE),
          end_date = COALESCE(end_date, (COALESCE(enrolled_at::date, CURRENT_DATE) + INTERVAL '29 days')::date),
          duration_days = COALESCE(NULLIF(duration_days, 0), 30),
          gross_price = CASE WHEN gross_price = 0 AND total_price > 0 THEN total_price ELSE gross_price END,
          amount_paid = CASE WHEN amount_paid = 0 AND total_price > 0 AND amount_due = 0 THEN total_price ELSE amount_paid END,
          billing_month = COALESCE(billing_month, TO_CHAR(COALESCE(enrolled_at, NOW()), 'YYYY-MM'))
      WHERE start_date IS NULL OR end_date IS NULL OR (amount_paid = 0 AND total_price > 0 AND amount_due = 0);
    `);

    console.log('✅ Accounting & Subscriptions Schema verified (sessions_per_month & day-based packages).');
  } catch (err) {
    console.error('⚠️ Error ensuring accounting schema:', err.message);
  }
}

module.exports = { ensureAccountingSchema };

