import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: Add type_of_concern columns...');
    
    await client.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS type_of_concern VARCHAR(100),
      ADD COLUMN IF NOT EXISTS type_of_concern_other TEXT;
    `);
    
    console.log('✓ Migration completed successfully');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
