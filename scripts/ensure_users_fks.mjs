import pg from 'pg';
const { Client } = pg;

const checks = [
  { table: 'hospital_profiles', column: 'user_id', constraint: 'hospital_profiles_user_id_users_id_fk' },
  { table: 'donor_profiles', column: 'user_id', constraint: 'donor_profiles_user_id_users_id_fk' },
  { table: 'recipient_profiles', column: 'user_id', constraint: 'recipient_profiles_user_id_users_id_fk' },
  { table: 'account', column: 'userId', constraint: 'account_userId_users_id_fk' },
  { table: 'audit_logs', column: 'user_id', constraint: 'audit_logs_user_id_users_id_fk' },
  { table: 'chat_messages', column: 'sender_id', constraint: 'chat_messages_sender_id_users_id_fk' },
  { table: 'notifications', column: 'user_id', constraint: 'notifications_user_id_users_id_fk' },
  { table: 'session', column: 'userId', constraint: 'session_userId_users_id_fk' }
];

async function main(){
  const databaseUrl = process.env.DATABASE_URL;
  if(!databaseUrl){
    console.error('Set DATABASE_URL env var or run with: DATABASE_URL="..." node scripts/ensure_users_fks.mjs');
    process.exit(1);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try{
    await client.query('BEGIN');
    for(const c of checks){
      const existsRes = await client.query(`
        SELECT 1 FROM pg_constraint
        WHERE contype='f'
          AND conrelid = $1::regclass
          AND pg_get_constraintdef(pg_constraint.oid) LIKE '%REFERENCES users(id)%'
        LIMIT 1
      `, [c.table]);
      if(existsRes.rowCount > 0){
        console.log(`Constraint referencing users exists for ${c.table} -> skipping`);
        continue;
      }
      // Check column exists
      const colRes = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND LOWER(column_name) = LOWER($2)`, [c.table, c.column]);
      if(colRes.rowCount === 0){
        console.log(`Table ${c.table} does not have column ${c.column}; skipping add constraint`);
        continue;
      }
      const actualCol = colRes.rows[0].column_name;
      const addSql = `ALTER TABLE "${c.table}" ADD CONSTRAINT ${c.constraint} FOREIGN KEY ("${actualCol}") REFERENCES users(id) ON DELETE CASCADE`;
      console.log('Adding constraint:', addSql);
      await client.query(addSql);
    }
    await client.query('COMMIT');
    console.log('ensure_users_fks finished.');
  }catch(err){
    console.error('Error ensuring FKs:', err);
    try{ await client.query('ROLLBACK'); }catch(e){}
  }finally{
    await client.end();
  }
}

main();
