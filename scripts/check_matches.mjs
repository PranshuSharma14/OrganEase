import { config } from 'dotenv';
config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { matches, donorProfiles, recipientProfiles } from '../src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function checkMatches() {
  try {
    console.log('Fetching all matches...\n');
    
    const allMatches = await db.select().from(matches);
    
    console.log(`Found ${allMatches.length} match(es)\n`);
    
    for (const match of allMatches) {
      console.log('---');
      console.log('Match ID:', match.id);
      console.log('Donor ID:', match.donorId);
      console.log('Recipient ID:', match.recipientId);
      console.log('Organ Type:', match.organType);
      console.log('Match Score:', match.matchScore);
      console.log('Status:', match.status);
      console.log('Approved by Hospital:', match.approvedByHospital);
      console.log('Hospital ID:', match.hospitalId);
      console.log('Created At:', match.createdAt);
      
      // Get donor details
      const donor = await db.select().from(donorProfiles).where(eq(donorProfiles.id, match.donorId)).limit(1);
      if (donor[0]) {
        console.log('\nDonor Details:');
        console.log('  Name:', donor[0].fullName);
        console.log('  Blood Group:', donor[0].bloodGroup);
        console.log('  State:', donor[0].state);
        console.log('  Age:', donor[0].age);
        console.log('  Emergency Available:', donor[0].emergencyAvailable);
      }
      
      // Get recipient details
      const recipient = await db.select().from(recipientProfiles).where(eq(recipientProfiles.id, match.recipientId)).limit(1);
      if (recipient[0]) {
        console.log('\nRecipient Details:');
        console.log('  Name:', recipient[0].patientName);
        console.log('  Blood Group:', recipient[0].bloodGroup);
        console.log('  State:', recipient[0].state);
        console.log('  Age:', recipient[0].age);
        console.log('  Priority:', recipient[0].priority);
        console.log('  Required Organ:', recipient[0].requiredOrgan);
      }
      
      console.log('\n');
    }
    
  } catch (error) {
    console.error('Error checking matches:', error);
  } finally {
    await client.end();
  }
}

checkMatches();
