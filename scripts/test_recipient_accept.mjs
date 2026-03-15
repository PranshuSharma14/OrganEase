import { config } from 'dotenv';
config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { matches } from '../src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function testRecipientAccept() {
  try {
    const matchId = 'b7ca7729-b823-4a36-bf87-afd0b407188f';
    
    console.log('Testing recipient accept for match:', matchId);
    console.log('');
    
    // Get current match state
    const match = await db.select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);
    
    if (match.length === 0) {
      console.log('Match not found');
      await client.end();
      return;
    }
    
    const currentMatch = match[0];
    console.log('Current Match State:');
    console.log('  Donor Accepted:', currentMatch.donorAccepted);
    console.log('  Recipient Accepted:', currentMatch.recipientAccepted);
    console.log('  Approved by Hospital:', currentMatch.approvedByHospital);
    console.log('  Status:', currentMatch.status);
    console.log('');
    
    // Simulate recipient accepting
    console.log('Simulating recipient acceptance...');
    const [updatedMatch] = await db.update(matches)
      .set({
        recipientAccepted: true,
        recipientAcceptedAt: new Date(),
        // Status stays as 'approved' - don't change to 'both-accepted'
      })
      .where(eq(matches.id, matchId))
      .returning();
    
    console.log('');
    console.log('Updated Match State:');
    console.log('  Donor Accepted:', updatedMatch.donorAccepted);
    console.log('  Recipient Accepted:', updatedMatch.recipientAccepted);
    console.log('  Approved by Hospital:', updatedMatch.approvedByHospital);
    console.log('  Status:', updatedMatch.status);
    console.log('  Recipient Accepted At:', updatedMatch.recipientAcceptedAt);
    console.log('');
    console.log('✅ Recipient acceptance successful!');
    
    if (updatedMatch.donorAccepted && updatedMatch.recipientAccepted) {
      console.log('🎉 Both parties have accepted! Chat is now enabled.');
    } else {
      console.log('⏳ Waiting for donor to accept...');
    }
    
  } catch (error) {
    console.error('Error testing recipient accept:', error);
  } finally {
    await client.end();
  }
}

testRecipientAccept();
