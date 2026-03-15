import pg from 'pg';
const { Client } = pg;

async function main(){
  const databaseUrl = process.env.DATABASE_URL;
  if(!databaseUrl){
    console.error('Set DATABASE_URL env var or run with: DATABASE_URL="..." node scripts/list_bad_fks.mjs');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try{
    const sql = `
SELECT conname,
       conrelid::regclass AS table_from,
       confrelid::regclass AS table_to,
       pg_get_constraintdef(pg_constraint.oid) AS constraint_def
FROM pg_constraint
WHERE contype = 'f'
ORDER BY conname;
`;
    const res = await client.query(sql);
    if(res.rows.length === 0){
      console.log('No foreign key constraints found.');
    } else {
      console.log('Foreign key constraints:');
      for(const r of res.rows){
        console.log(`- ${r.conname}: ${r.table_from} -> ${r.table_to}`);
        console.log(`  def: ${r.constraint_def}`);
      }
    }

    // Also list any FKs pointing to table "user"
    const res2 = await client.query(`SELECT conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to FROM pg_constraint WHERE contype='f' AND confrelid::regclass::text = 'user' ORDER BY conname;`);
    if(res2.rows.length === 0){
      console.log('\nNo FKs referencing table "user" found.');
    } else {
      console.log('\nFKs referencing table "user":');
      for(const r of res2.rows){
        console.log(`- ${r.conname}: ${r.table_from} -> ${r.table_to}`);
      }
    }

  }catch(err){
    console.error('Query failed:', err);
  }finally{
    await client.end();
  }
}

main();
