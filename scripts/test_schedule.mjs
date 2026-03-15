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

async function testSchedule() {
  try {
    const matchId = 'b7ca7729-b823-4a36-bf87-afd0b407188f';
    
    console.log('Testing schedule for match:', matchId);
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
    console.log('  Test Scheduled Date:', currentMatch.testScheduledDate);
    console.log('  Procedure Scheduled Date:', currentMatch.procedureScheduledDate);
    console.log('  Status:', currentMatch.status);
    console.log('');
    
    // Simulate scheduling a test
    console.log('Simulating test scheduling...');
    const testDate = new Date('2025-12-25T10:00:00');
    const [updatedMatch] = await db.update(matches)
      .set({
        testScheduledDate: testDate,
        // Don't change status - keep it as 'approved'
      })
      .where(eq(matches.id, matchId))
      .returning();
    
    console.log('');
    console.log('Updated Match State:');
    console.log('  Test Scheduled Date:', updatedMatch.testScheduledDate);
    console.log('  Procedure Scheduled Date:', updatedMatch.procedureScheduledDate);
    console.log('  Status:', updatedMatch.status);
    console.log('');
    console.log('✅ Test scheduling successful!');
    
  } catch (error) {
    console.error('Error testing schedule:', error);
  } finally {
    await client.end();
  }
}

testSchedule();
