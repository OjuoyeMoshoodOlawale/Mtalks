/**
 * Emergency admin password reset — run from project root:
 *   node server/scripts/reset-admin-password.js [newpassword]
 * Default password: Admin@1234
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

const NEW_PASSWORD = process.argv[2] || 'Admin@1234';

(async () => {
  const db = await mysql.createConnection({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mtalks_db',
  });

  const hash = await bcrypt.hash(NEW_PASSWORD, 12);
  const [r] = await db.execute(
    'UPDATE users SET password = ?, is_verified = 1, is_active = 1 WHERE role = ?',
    [hash, 'admin']
  );

  if (r.affectedRows === 0) {
    await db.execute(
      `INSERT INTO users (name,email,password,role,is_verified,is_active)
       VALUES ('Admin','admin@muhsinahacademy.com',?,'admin',1,1)`,
      [hash]
    );
    console.log('Admin created: admin@muhsinahacademy.com / ' + NEW_PASSWORD);
  } else {
    console.log(`Admin password reset. Login: admin@muhsinahacademy.com / ${NEW_PASSWORD}`);
  }
  await db.end();
})().catch(e => { console.error(e.message); process.exit(1); });
