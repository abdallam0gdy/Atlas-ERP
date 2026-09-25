const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '006_student_enrollment_type.sql'), 'utf8');
    await db.query(sql);
    console.log("Migration 006 successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}
main();
