import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run(){
  try{
    console.log('Dropping constraint donor_profiles_user_id_user_id_fk if exists...');
    await sql`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'donor_profiles_user_id_user_id_fk') THEN ALTER TABLE donor_profiles DROP CONSTRAINT donor_profiles_user_id_user_id_fk; END IF; END$$;`;
    console.log('Done.');
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }finally{
    await sql.end();
  }
}
run();
