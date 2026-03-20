// Direct SQL fix: add missing enum values and create missing tables
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_ibL85oOnSQGl@ep-withered-block-a44c2x7s-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
});

async function fix() {
  const client = await pool.connect();
  try {
    // 1. Check current enum values
    const enumRes = await client.query(`SELECT unnest(enum_range(NULL::user_role))::text AS val`);
    const currentValues = enumRes.rows.map(r => r.val);
    console.log("Current enum values:", currentValues);

    // 2. Add 'admin' if missing
    if (!currentValues.includes('admin')) {
      await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'`);
      console.log("Added 'admin' to user_role enum");
    }

    // 3. Check which tables exist
    const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log("Existing tables:", tables);

    // 4. Create 'account' table if missing
    if (!tables.includes('account')) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "account" (
          "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "type" text NOT NULL,
          "provider" text NOT NULL,
          "providerAccountId" text NOT NULL,
          "refresh_token" text,
          "access_token" text,
          "expires_at" integer,
          "token_type" text,
          "scope" text,
          "id_token" text,
          "session_state" text,
          PRIMARY KEY ("provider", "providerAccountId")
        )
      `);
      console.log("Created 'account' table");
    } else {
      console.log("'account' table already exists");
    }

    // 5. Create 'session' table if missing
    if (!tables.includes('session')) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sessionToken" text NOT NULL PRIMARY KEY,
          "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "expires" timestamp NOT NULL
        )
      `);
      console.log("Created 'session' table");
    } else {
      console.log("'session' table already exists");
    }

    // 6. Create 'verification_token' table if missing
    if (!tables.includes('verification_token')) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "verification_token" (
          "identifier" text NOT NULL,
          "token" text NOT NULL,
          "expires" timestamp NOT NULL,
          PRIMARY KEY ("identifier", "token")
        )
      `);
      console.log("Created 'verification_token' table");
    } else {
      console.log("'verification_token' table already exists");
    }

    // 7. Create hospital_messages table if missing
    if (!tables.includes('hospital_messages')) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "hospital_messages" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "hospital_id" uuid NOT NULL REFERENCES "users"("id"),
          "target_user_id" uuid NOT NULL REFERENCES "users"("id"),
          "match_id" uuid REFERENCES "matches"("id"),
          "subject" text NOT NULL,
          "message" text NOT NULL,
          "sent_by" text NOT NULL DEFAULT 'hospital',
          "is_read" boolean NOT NULL DEFAULT false,
          "created_at" timestamp NOT NULL DEFAULT now()
        )
      `);
      console.log("Created 'hospital_messages' table");
    } else {
      console.log("'hospital_messages' table already exists");
    }

    // 8. Add missing columns to existing tables
    // Add ai columns to matches if missing
    try { await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_risk_score" integer`); } catch(e) {}
    try { await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_risk_flags" jsonb`); } catch(e) {}
    try { await client.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS "ai_match_explanation" text`); } catch(e) {}

    // Add verification_status to hospital_profiles if missing
    try {
      // Create the enum if not exists
      await client.query(`DO $$ BEGIN CREATE TYPE hospital_verification_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
      await client.query(`ALTER TABLE hospital_profiles ADD COLUMN IF NOT EXISTS "verification_status" hospital_verification_status NOT NULL DEFAULT 'pending'`);
      await client.query(`ALTER TABLE hospital_profiles ADD COLUMN IF NOT EXISTS "admin_notes" text`);
    } catch (e) { console.log("hospital columns:", e.message); }

    // Add registered_hospital_id to users if missing
    try { await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "registered_hospital_id" uuid REFERENCES "hospital_profiles"("id")`); } catch(e) {}

    console.log("\n✅ All fixes applied! Database is ready.");

    // Final check
    const finalTables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    console.log("Final tables:", finalTables.rows.map(r => r.table_name));

  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

fix();
