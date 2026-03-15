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
  console.log('Running ALTER TABLE to add consent_form if missing...');
  await sql`ALTER TABLE IF EXISTS donor_profiles ADD COLUMN IF NOT EXISTS consent_form text;`;
  console.log('Success: consent_form column ensured.');
} catch (err) {
  console.error('Error running ALTER:', err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
