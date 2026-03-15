import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run(){
  const email = process.argv[2];
  if(!email){
    console.error('Usage: node scripts/find_user_by_email.mjs <email>');
    process.exit(1);
  }
  try{
    const rows = await sql`select id,email,role,phone,name from users where email = ${email}`;
    console.log(rows);
  }catch(err){
    console.error(err);
  }finally{
    await sql.end();
  }
}

run();
