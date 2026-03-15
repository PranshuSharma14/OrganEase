import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recipientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { findMatches, createMatch } from "@/lib/matching-engine";

// GET: Create matches for all verified recipients (one-time fix)
// Note: This is a one-time fix endpoint - temporarily allowing without auth
export async function GET(req: NextRequest) {
  try {
    // Temporarily allow without auth for one-time fix
    // TODO: Remove this endpoint or add proper auth after fixing existing data

    // Get all verified recipients
    const verifiedRecipients = await db.query.recipientProfiles.findMany({
      where: eq(recipientProfiles.documentsVerified, true),
    });

    let createdCount = 0;
    const errors: string[] = [];

    for (const recipient of verifiedRecipients) {
      try {
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
          createdCount++;
          console.log('Created match:', {
            donorId: bestMatch.donorId,
            recipientId: bestMatch.recipientId,
            organType: bestMatch.organType,
          });
        }
      } catch (error: any) {
        errors.push(`Error creating match for recipient ${recipient.id}: ${error.message}`);
        console.error('Error creating match:', error);
      }
    }

    return NextResponse.json({ 
      success: true,
      created: createdCount,
      totalRecipients: verifiedRecipients.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error creating matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

