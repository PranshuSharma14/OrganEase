import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/services/authService";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { detectRisk } from "@/lib/services/aiService";

// GET: Run AI risk detection on all matches and return flags
export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    // Get all matches with donor & recipient data
    const allMatches = await db.query.matches.findMany({
      with: {
        donor: {
          columns: {
            id: true, fullName: true, age: true, bloodGroup: true,
            city: true, state: true, createdAt: true,
          },
        },
        recipient: {
          columns: {
            id: true, patientName: true, age: true, bloodGroup: true,
            city: true, state: true, requiredOrgan: true, createdAt: true,
          },
        },
        hospital: {
          columns: { id: true, hospitalName: true, city: true },
        },
      },
    });

    if (allMatches.length === 0) {
      return NextResponse.json({ flags: [], message: "No matches to analyze" });
    }

    // Run AI risk detection on each match
    const flags = [];
    for (const match of allMatches) {
      if (!match.donor || !match.recipient) continue;

      try {
        const result = await detectRisk({
          donorAge: match.donor.age || 0,
          recipientAge: match.recipient.age || 0,
          donorCity: match.donor.city || "",
          recipientCity: match.recipient.city || "",
          donorState: match.donor.state || "",
          recipientState: match.recipient.state || "",
          organType: match.organType || "",
          matchScore: match.matchScore || 0,
          donorRegistrationDate: match.donor.createdAt?.toString() || "",
          recipientRegistrationDate: match.recipient.createdAt?.toString() || "",
        });

        if (result.riskScore > 0 || result.flags.length > 0) {
          flags.push({
            id: match.id,
            matchId: match.id,
            donorName: match.donor.fullName,
            recipientName: match.recipient.patientName,
            hospitalName: match.hospital?.hospitalName || "—",
            organType: match.organType,
            matchScore: match.matchScore,
            riskScore: result.riskScore,
            riskFlags: result.flags,
            explanation: result.explanation,
            severity: result.riskScore >= 60 ? "high" : result.riskScore >= 30 ? "medium" : "low",
            detectedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Risk detection failed for match:", match.id, err);
      }
    }

    // Sort by risk score descending
    flags.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({ flags });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error("Flags API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
