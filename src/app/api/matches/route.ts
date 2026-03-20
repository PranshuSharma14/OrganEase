import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { findMatches } from "@/lib/matching-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is hospital
    if (session.user.role !== "hospital") {
      return NextResponse.json({ error: "Only hospitals can trigger matches" }, { status: 403 });
    }

    const body = await req.json();
    const { recipientId } = body;

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID required" }, { status: 400 });
    }

    // Find matches
    const matchResults = await findMatches(recipientId);

    return NextResponse.json({ matches: matchResults, count: matchResults.length });
  } catch (error) {
    console.error("Error finding matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const userId = searchParams.get("userId");

    // For hospital role, get matches assigned to this hospital
    if (role === "hospital") {
      // First get the hospital profile ID
      const hospitalProfile = await db.query.hospitalProfiles.findFirst({
        where: (hospitalProfiles, { eq }) => eq(hospitalProfiles.userId, session.user.id),
        columns: { id: true },
      });

      if (!hospitalProfile) {
        return NextResponse.json({ matches: [] });
      }

      // Get all matches where this hospital is assigned OR where hospital approval is needed
      const hospitalMatches = await db.query.matches.findMany({
        where: (matches, { eq, or, and, isNull }) => or(
          eq(matches.hospitalId, hospitalProfile.id),
          // Also include matches without hospital assignment that need approval
          and(
            isNull(matches.hospitalId),
            eq(matches.approvedByHospital, false)
          )
        ),
        with: {
          donor: true,
          recipient: true,
          hospital: true,
        },
        orderBy: (matches, { desc }) => [desc(matches.createdAt)],
      });

      console.log('Hospital matches query result:', {
        hospitalId: hospitalProfile.id,
        matchCount: hospitalMatches.length,
        matches: hospitalMatches.map(m => ({
          id: m.id,
          status: m.status,
          approvedByHospital: m.approvedByHospital,
          hospitalId: m.hospitalId,
          matchScore: m.matchScore,
        }))
      });

      // Transform matches to include score field for frontend compatibility
      const transformedMatches = hospitalMatches.map(match => ({
        ...match,
        score: match.matchScore, // Map matchScore to score for frontend
      }));

      return NextResponse.json({ matches: transformedMatches });
    }

    // Get user's matches (for donors/recipients)
    const userMatches = await db.query.matches.findMany({
      where: (matches, { eq, or }) => or(
        eq(matches.donorId, userId!),
        eq(matches.recipientId, userId!)
      ),
      with: {
        donor: true,
        recipient: true,
        hospital: true,
      },
    });

    return NextResponse.json(userMatches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  console.log("PATCH /api/matches called");
  try {
    const session = await auth();
    if (!session?.user) {
      console.log("PATCH /api/matches — no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId, action, date, role } = body;
    console.log("PATCH /api/matches body:", { matchId, action, date, role });

    if (!matchId || !action) {
      return NextResponse.json({ error: "matchId and action required" }, { status: 400 });
    }

    // Verify the match exists
    const existingMatch = await db.query.matches.findFirst({
      where: (m, { eq: e }) => e(m.id, matchId),
    });

    if (!existingMatch) {
      console.log("PATCH /api/matches — match not found:", matchId);
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    console.log("Found match:", existingMatch.id, "status:", existingMatch.status);

    if (action === "approve") {
      await db.update(matches).set({
        approvedByHospital: true,
        approvedAt: new Date(),
        status: "approved" as any,
      }).where(eq(matches.id, matchId));
      console.log("Match approved successfully:", matchId);
      return NextResponse.json({ success: true, message: "Match approved" });
    }

    if (action === "schedule-test") {
      await db.update(matches).set({
        testScheduledDate: new Date(date),
      }).where(eq(matches.id, matchId));
      return NextResponse.json({ success: true, message: "Test scheduled" });
    }

    if (action === "schedule-procedure") {
      await db.update(matches).set({
        procedureScheduledDate: new Date(date),
      }).where(eq(matches.id, matchId));
      return NextResponse.json({ success: true, message: "Procedure scheduled" });
    }

    if (action === "complete") {
      await db.update(matches).set({
        status: "completed" as any,
        completedAt: new Date(),
      }).where(eq(matches.id, matchId));
      return NextResponse.json({ success: true, message: "Match completed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/matches ERROR:", error?.message, error?.stack);
    return NextResponse.json({ error: "Failed to update match: " + (error?.message || "unknown") }, { status: 500 });
  }
}

