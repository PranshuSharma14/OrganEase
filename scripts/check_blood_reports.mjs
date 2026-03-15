import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

async function run(){
  try{
    console.log('Querying donor_profiles for blood_group_report (limit 50)...');
    const rows = await sql`select id, user_id, aadhaar_url, medical_certificate_url, blood_group_report, consent_form from donor_profiles order by created_at desc limit 50`;
    if(!rows || rows.length===0){
      console.log('No donor_profiles rows found');
    } else {
      for(const r of rows){
        console.log('---');
        console.log('id:', r.id);
        console.log('user_id:', r.user_id);
        console.log('aadhaar_url:', r.aadhaar_url);
        console.log('medical_certificate_url:', r.medical_certificate_url);
        console.log('blood_group_report:', r.blood_group_report);
        console.log('consent_form:', r.consent_form);
      }
    }
  }catch(err){
    console.error('Error querying DB:', err);
    process.exitCode = 1;
  }finally{
    await sql.end();
  }
}

run();
