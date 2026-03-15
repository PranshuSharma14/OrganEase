import { db } from "@/lib/db";
import { matches, donorProfiles, recipientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Script to fix existing matches by assigning hospitalId
 * Run this once to update all existing matches
 */
async function fixMatchHospitals() {
  console.log("Starting to fix match hospital assignments...");

  // Get all matches without a hospitalId
  const matchesWithoutHospital = await db.query.matches.findMany({
    where: eq(matches.hospitalId, null as any),
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
        console.log(`⚠ Skipped match ${match.id} - no hospital found for donor or recipient`);
        skipped++;
      }
    } catch (error) {
      console.error(`✗ Error updating match ${match.id}:`, error);
      skipped++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total matches processed: ${matchesWithoutHospital.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

// Run the script
fixMatchHospitals()
  .then(() => {
    console.log("\nScript completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed:", error);
    process.exit(1);
  });
