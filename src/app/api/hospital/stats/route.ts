import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, matches, hospitalProfiles } from "@/lib/db/schema";
import { count, eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ 
        totalVerified: 0,
        pendingReview: 0,
        activeMatches: 0,
        completedProcedures: 0
      });
    }

    // Get hospital profile
    const hospitalProfile = await db.query.hospitalProfiles.findFirst({
      where: eq(hospitalProfiles.userId, session.user.id),
    });

    if (!hospitalProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const hospitalId = hospitalProfile.id;

    // Get statistics scoped to this hospital
    const [
      totalVerifiedDonors,
      totalVerifiedRecipients,
      pendingDonors,
      pendingRecipients,
      activeMatchesCount,
      completedMatchesCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(donorProfiles).where(and(eq(donorProfiles.documentsVerified, true), eq(donorProfiles.verifiedByHospitalId, hospitalId))),
      db.select({ count: count() }).from(recipientProfiles).where(and(eq(recipientProfiles.documentsVerified, true), eq(recipientProfiles.verifiedByHospitalId, hospitalId))),
      db.select({ count: count() }).from(donorProfiles).where(eq(donorProfiles.documentsVerified, false)),
      db.select({ count: count() }).from(recipientProfiles).where(and(eq(recipientProfiles.documentsVerified, false), eq(recipientProfiles.registeredHospitalId, hospitalId))),
      db.select({ count: count() }).from(matches).where(and(eq(matches.status, "matched"), eq(matches.hospitalId, hospitalId))),
      db.select({ count: count() }).from(matches).where(and(eq(matches.status, "completed"), eq(matches.hospitalId, hospitalId))),
    ]);

    const totalVerified = (totalVerifiedDonors[0]?.count || 0) + (totalVerifiedRecipients[0]?.count || 0);
    const pendingReview = (pendingDonors[0]?.count || 0) + (pendingRecipients[0]?.count || 0);
    const activeMatches = activeMatchesCount[0]?.count || 0;
    const completedProcedures = completedMatchesCount[0]?.count || 0;

    return NextResponse.json({
      totalVerified,
      pendingReview,
      activeMatches,
      completedProcedures,
    });
  } catch (error) {
    console.error("Error fetching hospital stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
