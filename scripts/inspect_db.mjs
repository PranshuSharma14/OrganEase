import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run(){
  console.log('Tables:');
  const tables = await sql`select table_name from information_schema.tables where table_schema='public' order by table_name`;
  console.log(tables.map(r=>r.table_name).join(', '));

  console.log('\nChecking for user and users tables:');
  const hasUser = await sql`select to_regclass('public.user') is not null as exists`;
  const hasUsers = await sql`select to_regclass('public.users') is not null as exists`;
  console.log('public.user exists:', !!hasUser[0].exists);
  console.log('public.users exists:', !!hasUsers[0].exists);

  console.log('\nConstraints referencing donor_profiles.user_id:');
  const constraints = await sql`select conname, conrelid::regclass as table_from, confrelid::regclass as table_to from pg_constraint where contype='f' and conkey is not null and conrelid::regclass::text = 'donor_profiles' or confrelid::regclass::text = 'donor_profiles'`;
  console.log(constraints);

  await sql.end();
}

run().catch(err=>{console.error(err);process.exit(1)});
