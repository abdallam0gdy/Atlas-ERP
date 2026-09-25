const db = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query("UPDATE users SET password_hash = $1 WHERE username = 'admin'", [hash]);
  console.log("Password updated");
  process.exit(0);
}
main();
