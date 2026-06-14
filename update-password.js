const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'postgres',
  password: 'Ni11082005',
  host: 'localhost',
  port: 5432,
  database: 'EcoDataBD'
});

async function updatePassword() {
  try {
    const hashedPassword = '$2b$10$sJu/iS5Vzmza26o6h3oZ0uxmkwkmk7/UzPDVzZSokKYUwBjfy7mV.';
    
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE email = $2 RETURNING id, email, nombre',
      [hashedPassword, 'nicoleramirezneyra@gmail.com']
    );
    
    console.log('✅ Password updated for:', result.rows[0]);
    console.log('Username: nicoleramirezneyra@gmail.com');
    console.log('Password: Test123!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updatePassword();
