import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches, donorProfiles, recipientProfiles } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Fix existing matches by assigning hospitalId
 * This endpoint updates all matches without a hospitalId
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "hospital") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all matches without a hospitalId
    const matchesWithoutHospital = await db.query.matches.findMany({
      where: isNull(matches.hospitalId),
    });

    console.log(`Found ${matchesWithoutHospital.length} matches without hospital assignment`);

    let updated = 0;
    let skipped = 0;

    for (const match of matchesWithoutHospital) {
      try {
        // Get donor and recipient
        const donor = await db.query.donorProfiles.findFirst({
          where: eq(donorProfiles.id, match.donorId),
        });

        const recipient = await db.query.recipientProfiles.findFirst({
          where: eq(recipientProfiles.id, match.recipientId),
        });

        // Assign hospital ID - prefer the recipient's hospital, fallback to donor's hospital
        const hospitalId = recipient?.verifiedByHospitalId || donor?.verifiedByHospitalId;

        if (hospitalId) {
          await db.update(matches)
            .set({ hospitalId })
            .where(eq(matches.id, match.id));
          
          console.log(`✓ Updated match ${match.id} with hospital ${hospitalId}`);
          updated++;
        } else {
          console.log(`⚠ Skipped match ${match.id} - no hospital found`);
          skipped++;
        }
      } catch (error) {
        console.error(`✗ Error updating match ${match.id}:`, error);
        skipped++;
      }
    }

    return NextResponse.json({ 
      success: true,
      updated,
      skipped,
      total: matchesWithoutHospital.length,
    });
  } catch (error: any) {
    console.error("Error fixing match hospitals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
