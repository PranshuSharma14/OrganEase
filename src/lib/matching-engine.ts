import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, matches } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type MatchScore = {
  donorId: string;
  recipientId: string;
  score: number;
  organType: string;
};

// Blood group compatibility matrix
const bloodCompatibility: Record<string, string[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

function isBloodCompatible(donorBlood: string, recipientBlood: string): boolean {
  return bloodCompatibility[donorBlood]?.includes(recipientBlood) || false;
}

function calculateDistanceScore(donorState: string, recipientState: string): number {
  // Simple scoring: same state = 30, different = 15
  return donorState === recipientState ? 30 : 15;
}

/**
 * Find compatible donor matches for a recipient
 * 
 * Match Score Calculation (Max 100 points):
 * - Blood group compatibility: 40 points
 * - Location proximity: 30 points (same state) or 15 points (different state)
 * - Emergency availability: 20 points (if recipient is emergency priority and donor is available)
 * - Age compatibility: 10 points (age diff < 10 years) or 5 points (age diff < 20 years)
 * 
 * @param recipientId - The ID of the recipient profile
 * @returns Array of match scores sorted by score (highest first)
 */
export async function findMatches(recipientId: string): Promise<MatchScore[]> {
  // Get recipient details
  const recipient = await db.query.recipientProfiles.findFirst({
    where: eq(recipientProfiles.id, recipientId),
  });

  if (!recipient) {
    throw new Error("Recipient not found");
  }

  // Find compatible donors
  const compatibleDonors = await db.query.donorProfiles.findMany({
    where: and(
      eq(donorProfiles.availability, "active"),
      eq(donorProfiles.documentsVerified, true)
    ),
  });

  const matchScores: MatchScore[] = [];

  for (const donor of compatibleDonors) {
    // Check if donor has the required organ
    const donorOrgans = donor.organs as string[];
    if (!donorOrgans.includes(recipient.requiredOrgan)) {
      continue;
    }

    // Check blood compatibility
    if (!isBloodCompatible(donor.bloodGroup, recipient.bloodGroup)) {
      continue;
    }

    // Calculate match score
    let score = 0;

    // Blood group match (40 points)
    score += isBloodCompatible(donor.bloodGroup, recipient.bloodGroup) ? 40 : 0;

    // Location proximity (30 points)
    score += calculateDistanceScore(donor.state, recipient.state);

    // Emergency availability (20 points)
    if (recipient.priority === "emergency" && donor.emergencyAvailable) {
      score += 20;
    }

    // Age compatibility (10 points)
    const ageDiff = Math.abs(donor.age - recipient.age);
    if (ageDiff < 10) score += 10;
    else if (ageDiff < 20) score += 5;

    matchScores.push({
      donorId: donor.id,
      recipientId: recipient.id,
      score,
      organType: recipient.requiredOrgan,
    });
  }

  // Sort by score descending
  return matchScores.sort((a, b) => b.score - a.score);
}

export async function createMatch(donorId: string, recipientId: string, organType: string, score: number) {
  // Check if match already exists
  const existingMatch = await db.query.matches.findFirst({
    where: and(
      eq(matches.donorId, donorId),
      eq(matches.recipientId, recipientId)
    ),
  });

  if (existingMatch) {
    return existingMatch;
  }

  // Get donor and recipient to find their verifying hospital
  const donor = await db.query.donorProfiles.findFirst({
    where: eq(donorProfiles.id, donorId),
  });

  const recipient = await db.query.recipientProfiles.findFirst({
    where: eq(recipientProfiles.id, recipientId),
  });

  // Assign hospital ID - prefer the recipient's hospital, fallback to donor's hospital
  const hospitalId = recipient?.verifiedByHospitalId || donor?.verifiedByHospitalId || null;

  const [match] = await db.insert(matches).values({
    donorId,
    recipientId,
    organType: organType as any,
    matchScore: score,
    status: "matched",
    hospitalId: hospitalId,
  }).returning();

  return match;
}

export async function autoMatch() {
  // Get all pending/verified recipients
  const pendingRecipients = await db.query.recipientProfiles.findMany({
    where: inArray(recipientProfiles.requestStatus, ["verified", "pending"]),
  });

  for (const recipient of pendingRecipients) {
    const potentialMatches = await findMatches(recipient.id);
    
    if (potentialMatches.length > 0) {
      // Create match with best candidate
      const bestMatch = potentialMatches[0];
      await createMatch(
        bestMatch.donorId,
        bestMatch.recipientId,
        bestMatch.organType,
        bestMatch.score
      );
    }
  }
}
