import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });
try {
  console.log('Ensuring users.phone and users.password columns exist...');
  await sql`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS phone text;`;
  await sql`ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password text;`;
  console.log('Done.');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
