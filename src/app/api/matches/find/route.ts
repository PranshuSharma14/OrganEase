import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { autoMatchForHospital } from "@/lib/services/matchingService";

// POST: Run matching engine for the hospital
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "hospital" && userRole !== "admin") {
      return NextResponse.json({ error: "Hospital access required" }, { status: 403 });
    }

    // Get hospital profile
    const hospital = await db.query.hospitalProfiles.findFirst({
      where: eq(hospitalProfiles.userId, session.user.id!),
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    if (hospital.verificationStatus !== "verified") {
      return NextResponse.json({ error: "Hospital must be verified to run matching" }, { status: 403 });
    }

    // Run same-hospital matching
    const results = await autoMatchForHospital(hospital.id);

    return NextResponse.json({
      success: true,
      results,
      message: `Found ${results.length} matches within your hospital pool`,
    });
  } catch (error) {
    console.error("Error running matching:", error);
    return NextResponse.json({ error: "Failed to run matching" }, { status: 500 });
  }
}
