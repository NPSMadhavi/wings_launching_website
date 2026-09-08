import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded whether run from repo root or apps/api directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const { Pool } = pkg;

function getPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }

  return new Pool({
    host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.PG_PORT || process.env.DB_PORT) || 5432,
    user: process.env.PG_USER || process.env.DB_USER || 'postgres',
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PG_NAME || process.env.DB_NAME || 'postgres',
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
}

const pool = getPool();

async function runMigration() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL database. Running migration for appointments table...');

    await client.query(`
      ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS type_of_concern VARCHAR(100),
        ADD COLUMN IF NOT EXISTS type_of_concern_other TEXT,
        ADD COLUMN IF NOT EXISTS enquirer_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS enquirer_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS enquirer_relationship VARCHAR(100),
        ADD COLUMN IF NOT EXISTS enquirer_contact_number VARCHAR(50),
        ADD COLUMN IF NOT EXISTS enquirer_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS referral_agency_name VARCHAR(150),
        ADD COLUMN IF NOT EXISTS referral_agency_contact_person VARCHAR(150),
        ADD COLUMN IF NOT EXISTS referral_agency_contact_email VARCHAR(150),
        ADD COLUMN IF NOT EXISTS referral_agency_password TEXT,
        ADD COLUMN IF NOT EXISTS attachments_json TEXT,
        ADD COLUMN IF NOT EXISTS sub_counselling_types TEXT;
    `);

    console.log('✓ Migration completed successfully: All required appointment columns verified/added.');
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
