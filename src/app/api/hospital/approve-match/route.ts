import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches, donorProfiles, recipientProfiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "hospital") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, approved, notes } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Get the match
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Update the match with hospital approval
    await db
      .update(matches)
      .set({
        approvedByHospital: approved,
        approvedAt: approved ? new Date() : null,
        hospitalNotes: notes || null,
        status: approved ? "approved" : "rejected",
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    return NextResponse.json({ 
      success: true,
      message: approved ? "Match approved successfully" : "Match rejected"
    });
  } catch (error) {
    console.error("Error approving match:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "hospital") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Get match with full donor and recipient details
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: true,
        recipient: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Get donor user details
    const donorUser = await db.query.users.findFirst({
      where: eq(users.id, match.donorId),
      columns: { email: true, name: true, phone: true },
    });

    // Get recipient user details  
    const recipientUser = await db.query.users.findFirst({
      where: eq(users.id, match.recipientId),
      columns: { email: true, name: true, phone: true },
    });

    // Get full donor profile (select safe columns only)
    const donorProfile = await db.query.donorProfiles.findFirst({
      where: eq(donorProfiles.userId, match.donorId),
      columns: {
        id: true,
        userId: true,
        fullName: true,
        age: true,
        bloodGroup: true,
        city: true,
        state: true,
        organs: true,
        availability: true,
        emergencyAvailable: true,
        aadhaarUrl: true,
        medicalCertificateUrl: true,
        consentForm: true,
        documentsVerified: true,
      },
    });

    // Get full recipient profile (select safe columns only)
    const recipientProfile = await db.query.recipientProfiles.findFirst({
      where: eq(recipientProfiles.userId, match.recipientId),
      columns: {
        id: true,
        userId: true,
        patientName: true,
        age: true,
        bloodGroup: true,
        requiredOrgan: true,
        city: true,
        state: true,
        priority: true,
        documentsVerified: true,
      },
    });

    return NextResponse.json({
      match,
      donor: {
        ...donorProfile,
        ...donorUser,
      },
      recipient: {
        ...recipientProfile,
        ...recipientUser,
      },
    });
  } catch (error) {
    console.error("Error fetching match details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
