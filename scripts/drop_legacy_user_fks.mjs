import pg from 'pg';
const { Client } = pg;

async function main(){
  const databaseUrl = process.env.DATABASE_URL;
  if(!databaseUrl){
    console.error('Set DATABASE_URL env var or run with: DATABASE_URL="..." node scripts/drop_legacy_user_fks.mjs');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try{
    const oidRes = await client.query("SELECT 'user'::regclass::oid AS oid");
    const userOid = oidRes.rows[0] && oidRes.rows[0].oid;
    if(!userOid){
      console.log('Legacy table "user" not found (no drops necessary).');
      return;
    }
    console.log('Found legacy table "user" OID:', userOid);

    const fkRes = await client.query(`SELECT oid, conname, conrelid::regclass AS table_from, confrelid::regclass AS table_to FROM pg_constraint WHERE contype='f' AND confrelid = $1 ORDER BY conname`, [userOid]);
    if(fkRes.rows.length === 0){
      console.log('No foreign key constraints reference table "user".');
      return;
    }
    console.log('Found', fkRes.rows.length, 'FK constraints referencing "user":');
    for(const r of fkRes.rows){
      console.log(`- ${r.conname}: ${r.table_from} -> ${r.table_to}`);
    }

    await client.query('BEGIN');
    for(const r of fkRes.rows){
      const dropSql = `ALTER TABLE ${r.table_from} DROP CONSTRAINT IF EXISTS ${r.conname};`;
      console.log('Executing:', dropSql);
      await client.query(dropSql);
    }
    await client.query('COMMIT');
    console.log('Dropped legacy "user" FKs successfully.');
  }catch(err){
    console.error('Error dropping legacy FKs:', err);
    try{ await client.query('ROLLBACK'); }catch(e){}
  }finally{
    await client.end();
  }
}

main();
