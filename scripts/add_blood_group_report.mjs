import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env.local');
  process.exit(1);
}

// Some hosted Postgres providers require SSL. Allow insecure SSL if certs not provided.
const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

try {
  console.log('Running ALTER TABLE to add blood_group_report if missing...');
  await sql`ALTER TABLE IF EXISTS donor_profiles ADD COLUMN IF NOT EXISTS blood_group_report text;`;
  console.log('Success: blood_group_report column ensured.');
} catch (err) {
  console.error('Error running ALTER:', err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
