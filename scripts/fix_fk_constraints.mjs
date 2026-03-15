import pg from 'pg';
const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set in environment. Set it or run with: DATABASE_URL="postgres://..." node scripts/fix_fk_constraints.mjs');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to DB. Running ALTER statements...');

    const sql = `
BEGIN;
-- hospital_profiles
ALTER TABLE IF EXISTS hospital_profiles DROP CONSTRAINT IF EXISTS hospital_profiles_user_id_user_id_fk;
ALTER TABLE IF EXISTS hospital_profiles ADD CONSTRAINT IF NOT EXISTS hospital_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- donor_profiles
ALTER TABLE IF EXISTS donor_profiles DROP CONSTRAINT IF EXISTS donor_profiles_user_id_user_id_fk;
ALTER TABLE IF EXISTS donor_profiles ADD CONSTRAINT IF NOT EXISTS donor_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- recipient_profiles
ALTER TABLE IF EXISTS recipient_profiles DROP CONSTRAINT IF EXISTS recipient_profiles_user_id_user_id_fk;
ALTER TABLE IF EXISTS recipient_profiles ADD CONSTRAINT IF NOT EXISTS recipient_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;
`;

    const res = await client.query(sql);
    console.log('ALTER statements executed successfully.');
    console.log(res.command || 'OK');
  } catch (err) {
    console.error('Failed to run ALTERs:', err);
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
