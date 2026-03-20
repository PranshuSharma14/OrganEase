import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/services/authService";
import { db } from "@/lib/db";
import { hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET: List verified hospitals (public for onboarding, or filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organType = searchParams.get("organType");
    const state = searchParams.get("state");

    // Only return verified hospitals
    const hospitals = await db.query.hospitalProfiles.findMany({
      where: eq(hospitalProfiles.verificationStatus, "verified"),
      columns: {
        id: true,
        hospitalName: true,
        city: true,
        state: true,
        specializations: true,
        hospitalCode: true,
        address: true,
        phoneNumber: true,
      },
    });

    let filtered = hospitals;

    // Filter by state if provided
    if (state) {
      filtered = filtered.filter(h => h.state?.toLowerCase() === state.toLowerCase());
    }

    // Filter by organ specialization if provided
    if (organType) {
      filtered = filtered.filter(h =>
        !h.specializations || h.specializations.length === 0 ||
        h.specializations.some(s => s?.toLowerCase().includes(organType.toLowerCase()))
      );
    }

    return NextResponse.json({ hospitals: filtered });
  } catch (error) {
    console.error("Error listing hospitals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
