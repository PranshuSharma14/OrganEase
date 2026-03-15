import { config } from 'dotenv';
config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { recipientProfiles, users } from '../src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkRecipientProfile() {
  try {
    console.log('Fetching recipient profile for Suryansh Tomar...\n');
    
    // Get recipient profile
    const recipient = await db.select()
      .from(recipientProfiles)
      .where(eq(recipientProfiles.patientName, 'Suryansh Tomar'))
      .limit(1);
    
    if (recipient.length === 0) {
      console.log('No recipient profile found');
      await client.end();
      return;
    }
    
    const recipientProfile = recipient[0];
    console.log('Recipient Profile:');
    console.log('  ID:', recipientProfile.id);
    console.log('  User ID:', recipientProfile.userId);
    console.log('  Patient Name:', recipientProfile.patientName);
    console.log('  Blood Group:', recipientProfile.bloodGroup);
    console.log('  Required Organ:', recipientProfile.requiredOrgan);
    console.log('  Documents Verified:', recipientProfile.documentsVerified);
    
    // Get user details
    if (recipientProfile.userId) {
      const user = await db.select()
        .from(users)
        .where(eq(users.id, recipientProfile.userId))
        .limit(1);
      
      if (user.length > 0) {
        console.log('\nUser Details:');
        console.log('  User ID:', user[0].id);
        console.log('  Email:', user[0].email);
        console.log('  Name:', user[0].name);
        console.log('  Role:', user[0].role);
      }
    }
    
  } catch (error) {
    console.error('Error checking recipient profile:', error);
  } finally {
    await client.end();
  }
}

checkRecipientProfile();
