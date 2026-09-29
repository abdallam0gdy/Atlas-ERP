const db = require('../src/config/db');

async function resetSystemData() {
  console.log('🔄 بدء عملية تصفير البيانات وإعادة ضبط النظام للسنة الجديدة...');
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. Truncate operational tables with CASCADE to handle foreign keys cleanly
    console.log('🧹 مسح سجلات الحضور والغياب والحصص الملغاة...');
    await client.query('TRUNCATE TABLE attendance_logs CASCADE');
    await client.query('TRUNCATE TABLE cancelled_sessions CASCADE');

    console.log('🧹 مسح الاشتراكات والباكدجات والتسجيلات...');
    await client.query('TRUNCATE TABLE group_enrollments CASCADE');
    await client.query('TRUNCATE TABLE student_package_enrollments CASCADE');
    await client.query('TRUNCATE TABLE package_groups CASCADE');
    await client.query('TRUNCATE TABLE student_subscriptions CASCADE');

    console.log('🧹 مسح الملازم والكتب وحجوزاتها...');
    await client.query('TRUNCATE TABLE booklet_reservations CASCADE');
    await client.query('TRUNCATE TABLE booklet_groups CASCADE');
    await client.query('TRUNCATE TABLE pos_sale_items CASCADE');
    await client.query('TRUNCATE TABLE pos_sales CASCADE');
    await client.query('TRUNCATE TABLE inventory_items CASCADE');

    console.log('🧹 مسح المعاملات المالية والمصروفات والتقفيل اليومي...');
    await client.query('TRUNCATE TABLE treasury_transactions CASCADE');
    await client.query('TRUNCATE TABLE expenses CASCADE');
    await client.query('TRUNCATE TABLE daily_settlements CASCADE');

    console.log('🧹 مسح كروت الباركود وسجلات التدقيق...');
    await client.query('TRUNCATE TABLE barcode_items CASCADE');
    await client.query('TRUNCATE TABLE barcode_batches CASCADE');
    await client.query('TRUNCATE TABLE audit_log CASCADE');

    console.log('🧹 مسح المجموعات والطلاب والمدرسين...');
    await client.query('TRUNCATE TABLE groups CASCADE');
    await client.query('TRUNCATE TABLE students CASCADE');
    await client.query('TRUNCATE TABLE teachers CASCADE');

    // 2. Reset sequences
    console.log('🔢 إعادة ضبط السيكوينس (student_code_seq & booklet_reservation_seq)...');
    await client.query('ALTER SEQUENCE student_code_seq RESTART WITH 1001');
    await client.query('ALTER SEQUENCE booklet_reservation_seq RESTART WITH 1001');

    await client.query('COMMIT');
    console.log('✅ تم تصفير بيانات النظام بنجاح!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ أثناء تصفير البيانات:', err);
    throw err;
  } finally {
    client.release();
  }
}

resetSystemData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
