import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run(){
  try{
    console.log('Dropping bad FK constraint if exists: recipient_profiles_user_id_user_id_fk');
    await sql`ALTER TABLE IF EXISTS recipient_profiles DROP CONSTRAINT IF EXISTS recipient_profiles_user_id_user_id_fk`;

    // Check for good FK
    const exists = await sql`select conname from pg_constraint where contype='f' and conrelid::regclass::text = 'recipient_profiles' and confrelid::regclass::text = 'users'`;
    if(exists.length > 0){
      console.log('Good FK to users already exists:', exists.map(r=>r.conname).join(', '));
    } else {
      console.log('Adding FK constraint recipient_profiles_user_id_users_id_fk -> users(id)');
      await sql`ALTER TABLE recipient_profiles ADD CONSTRAINT recipient_profiles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id)`;
      console.log('Added constraint.');
    }

    console.log('Done.');
  }catch(err){
    console.error('Error:', err);
    process.exitCode = 1;
  }finally{
    await sql.end();
  }
}

run();
