import { pool, query } from '../src/config/db.js';

async function migrate() {
  try {
    console.log('Running admin_users table migration...');
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(100) NOT NULL DEFAULT 'counsellor',
        sections JSONB NOT NULL DEFAULT '[]',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      );
    `);
    console.log('✓ admin_users table checked / created successfully.');
    
    // Check columns
    const [rows] = await query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`,
      ['admin_users']
    );
    console.log('Columns in admin_users:', rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
