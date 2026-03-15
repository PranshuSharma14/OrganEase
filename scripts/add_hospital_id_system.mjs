import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env.local');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

try {
  console.log('Adding hospital_code column to hospital_profiles...');
  await sql`ALTER TABLE IF EXISTS hospital_profiles ADD COLUMN IF NOT EXISTS hospital_code text UNIQUE;`;
  console.log('Done: hospital_code added.');

  console.log('Adding registered_hospital_id column to recipient_profiles...');
  await sql`ALTER TABLE IF EXISTS recipient_profiles ADD COLUMN IF NOT EXISTS registered_hospital_id uuid REFERENCES hospital_profiles(id);`;
  console.log('Done: registered_hospital_id added.');

  console.log('Migration complete!');
} catch (err) {
  console.error('Migration error:', err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
