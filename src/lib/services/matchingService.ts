import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, matches, hospitalProfiles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type MatchScore = {
  donorId: string;
  recipientId: string;
  score: number;
  organType: string;
  breakdown: {
    bloodCompatibility: number;
    urgency: number;
    distance: number;
    waitingTime: number;
    verification: number;
  };
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

/**
 * Find compatible donor matches for a recipient — SAME HOSPITAL ONLY.
 * 
 * Match Score Calculation (Max 100 points):
 * - Blood group compatibility: 30 points (mandatory — incompatible = excluded)
 * - Urgency match: 25 points (high weight per requirement)
 * - Location proximity: 15 points (same city = 15, same state = 10, different = 5)
 * - Waiting time: 20 points (longer wait = higher priority)
 * - Verification status: 10 points (fully verified = 10)
 */
export async function findMatchesForRecipient(recipientId: string, hospitalId: string): Promise<MatchScore[]> {
  // Get recipient details
  const recipient = await db.query.recipientProfiles.findFirst({
    where: eq(recipientProfiles.id, recipientId),
  });

  if (!recipient) {
    throw new Error("Recipient not found");
  }

  // Find all verified, available donors (donors aren't tied to a specific hospital)
  const compatibleDonors = await db.query.donorProfiles.findMany({
    where: and(
      eq(donorProfiles.availability, "active"),
      eq(donorProfiles.documentsVerified, true),
    ),
  });

  const matchScores: MatchScore[] = [];
  const now = Date.now();

  for (const donor of compatibleDonors) {
    // Check if donor has the required organ
    const donorOrgans = donor.organs as string[];
    if (!donorOrgans.includes(recipient.requiredOrgan)) {
      continue;
    }

    // MANDATORY: Blood compatibility — skip if incompatible
    if (!isBloodCompatible(donor.bloodGroup, recipient.bloodGroup)) {
      continue;
    }

    const breakdown = {
      bloodCompatibility: 30,
      urgency: 0,
      distance: 0,
      waitingTime: 0,
      verification: 0,
    };

    // Urgency scoring (25 points max)
    if (recipient.priority === "emergency") {
      breakdown.urgency = donor.emergencyAvailable ? 25 : 15;
    } else if (recipient.priority === "high") {
      breakdown.urgency = 20;
    } else {
      breakdown.urgency = 10;
    }

    // Location proximity (15 points max)
    if (donor.city?.toLowerCase() === recipient.city?.toLowerCase()) {
      breakdown.distance = 15;
    } else if (donor.state?.toLowerCase() === recipient.state?.toLowerCase()) {
      breakdown.distance = 10;
    } else {
      breakdown.distance = 5;
    }

    // Waiting time (20 points max) — longer wait = higher score
    const recipientWaitDays = Math.floor((now - new Date(recipient.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (recipientWaitDays > 90) breakdown.waitingTime = 20;
    else if (recipientWaitDays > 60) breakdown.waitingTime = 15;
    else if (recipientWaitDays > 30) breakdown.waitingTime = 10;
    else breakdown.waitingTime = 5;

    // Verification status (10 points)
    breakdown.verification = donor.documentsVerified ? 10 : 0;

    const score = breakdown.bloodCompatibility + breakdown.urgency + breakdown.distance + breakdown.waitingTime + breakdown.verification;

    matchScores.push({
      donorId: donor.id,
      recipientId: recipient.id,
      score,
      organType: recipient.requiredOrgan,
      breakdown,
    });
  }

  // Sort by score descending
  return matchScores.sort((a, b) => b.score - a.score);
}

/**
 * Create a match between a donor and recipient within the same hospital.
 */
export async function createMatch(
  donorId: string,
  recipientId: string,
  organType: string,
  score: number,
  hospitalId: string
) {
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

  const [match] = await db.insert(matches).values({
    donorId,
    recipientId,
    organType: organType as any,
    matchScore: score,
    status: "matched",
    hospitalId,
  }).returning();

  return match;
}

/**
 * Auto-match all verified recipients within a specific hospital's pool.
 */
export async function autoMatchForHospital(hospitalId: string) {
  // Get all pending/verified recipients at this hospital
  const pendingRecipients = await db.query.recipientProfiles.findMany({
    where: and(
      inArray(recipientProfiles.requestStatus, ["verified", "pending"]),
      eq(recipientProfiles.registeredHospitalId, hospitalId)
    ),
  });

  const results = [];

  for (const recipient of pendingRecipients) {
    const potentialMatches = await findMatchesForRecipient(recipient.id, hospitalId);

    if (potentialMatches.length > 0) {
      const bestMatch = potentialMatches[0];
      const match = await createMatch(
        bestMatch.donorId,
        bestMatch.recipientId,
        bestMatch.organType,
        bestMatch.score,
        hospitalId
      );
      results.push({ recipientId: recipient.id, match, allMatches: potentialMatches });
    }
  }

  return results;
}
