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

// Blood group compatibility matrix
const bloodCompatibility = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

function isBloodCompatible(donorBlood, recipientBlood) {
  return bloodCompatibility[donorBlood]?.includes(recipientBlood) || false;
}

function calculateDistanceScore(donorState, recipientState) {
  // Same state = 30, different = 15
  return donorState === recipientState ? 30 : 15;
}

function calculateMatchScore(donor, recipient) {
  let score = 0;

  // Blood group match (40 points)
  score += isBloodCompatible(donor.bloodGroup, recipient.bloodGroup) ? 40 : 0;

  // Location proximity (30 points max)
  score += calculateDistanceScore(donor.state, recipient.state);

  // Emergency availability (20 points)
  if (recipient.priority === "emergency" && donor.emergencyAvailable) {
    score += 20;
  }

  // Age compatibility (10 points)
  const ageDiff = Math.abs(donor.age - recipient.age);
  if (ageDiff < 10) score += 10;
  else if (ageDiff < 20) score += 5;

  return score;
}

async function recalculateMatchScores() {
  try {
    console.log('Fetching all matches...\n');
    
    const allMatches = await db.select().from(matches);
    
    console.log(`Found ${allMatches.length} match(es) to recalculate\n`);
    
    let updated = 0;
    
    for (const match of allMatches) {
      console.log('---');
      console.log('Match ID:', match.id);
      console.log('Current Score:', match.matchScore);
      
      // Get donor details
      const donorResult = await db.select().from(donorProfiles).where(eq(donorProfiles.id, match.donorId)).limit(1);
      const donor = donorResult[0];
      
      // Get recipient details
      const recipientResult = await db.select().from(recipientProfiles).where(eq(recipientProfiles.id, match.recipientId)).limit(1);
      const recipient = recipientResult[0];
      
      if (!donor || !recipient) {
        console.log('⚠️  Skipping - donor or recipient not found');
        continue;
      }
      
      // Calculate new score
      const newScore = calculateMatchScore(donor, recipient);
      
      console.log('Donor:', donor.fullName, `(${donor.bloodGroup}, ${donor.state}, Age ${donor.age})`);
      console.log('Recipient:', recipient.patientName, `(${recipient.bloodGroup}, ${recipient.state}, Age ${recipient.age})`);
      console.log('New Score:', newScore);
      
      if (match.matchScore !== newScore) {
        // Update the match score
        await db.update(matches)
          .set({ matchScore: newScore, updatedAt: new Date() })
          .where(eq(matches.id, match.id));
        
        console.log('✅ Updated score from', match.matchScore, 'to', newScore);
        updated++;
      } else {
        console.log('✓ Score unchanged');
      }
      
      console.log('');
    }
    
    console.log(`\n✅ Recalculation complete! Updated ${updated} match(es).`);
    
  } catch (error) {
    console.error('Error recalculating match scores:', error);
  } finally {
    await client.end();
  }
}

recalculateMatchScores();
