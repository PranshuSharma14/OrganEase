import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
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
