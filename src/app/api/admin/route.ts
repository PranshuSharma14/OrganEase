import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/services/authService";
import { db } from "@/lib/db";
import { hospitalProfiles, users, donorProfiles, recipientProfiles, matches } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyHospital } from "@/lib/services/verificationService";
import { decryptDocUrls } from "@/lib/encryption";

// GET: Admin dashboard data — hospitals list, system stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("admin");

    // Get all hospitals with their verification status
    const hospitals = await db.query.hospitalProfiles.findMany({
      with: {
        user: {
          columns: { email: true, name: true, createdAt: true },
        },
      },
      orderBy: (hp, { desc }) => [desc(hp.createdAt)],
    });

    // Get all donors with user info
    const allDonors = await db.query.donorProfiles.findMany({
      with: {
        user: {
          columns: { email: true, name: true },
        },
      },
      orderBy: (dp, { desc }) => [desc(dp.createdAt)],
    });

    // Get all recipients with user info
    const allRecipients = await db.query.recipientProfiles.findMany({
      with: {
        user: {
          columns: { email: true, name: true },
        },
      },
      orderBy: (rp, { desc }) => [desc(rp.createdAt)],
    });

    // Get all matches with donor, recipient, hospital info
    const allMatches = await db.query.matches.findMany({
      with: {
        donor: {
          columns: { id: true, fullName: true, bloodGroup: true, city: true, state: true },
        },
        recipient: {
          columns: { id: true, patientName: true, bloodGroup: true, city: true, state: true, requiredOrgan: true, priority: true },
        },
        hospital: {
          columns: { id: true, hospitalName: true, city: true },
        },
      },
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    });

    // System stats
    const pendingHospitals = hospitals.filter(h => h.verificationStatus === "pending");
    const verifiedHospitals = hospitals.filter(h => h.verificationStatus === "verified");

    const statsObj = {
      totalUsers: allDonors.length + allRecipients.length + hospitals.length,
      totalDonors: allDonors.length,
      totalRecipients: allRecipients.length,
      totalMatches: allMatches.length,
      activeMatches: allMatches.filter(m => m.status === "approved" || m.status === "matched").length,
      completedMatches: allMatches.filter(m => m.status === "completed").length,
      pendingHospitals: pendingHospitals.length,
      verifiedHospitals: verifiedHospitals.length,
      totalHospitals: hospitals.length,
    };

    // Decrypt hospital document URLs for admin viewing
    const HOSPITAL_DOC_FIELDS = ["verificationDocUrl", "licenseDocUrl", "accreditationDocUrl"];
    const decryptedHospitals = hospitals.map(h => decryptDocUrls(h as any, HOSPITAL_DOC_FIELDS));

    return NextResponse.json({
      hospitals: decryptedHospitals,
      donors: allDonors,
      recipients: allRecipients,
      matches: allMatches,
      stats: statsObj,
    });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Admin actions — verify/reject hospitals, promote to admin
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("admin");
    const body = await request.json();
    const { action, hospitalId, status, notes, targetUserId, newRole } = body;

    if (action === "verify-hospital") {
      if (!hospitalId || !status) {
        return NextResponse.json({ error: "hospitalId and status required" }, { status: 400 });
      }

      const result = await verifyHospital(hospitalId, status, notes || "", user.email);
      return NextResponse.json(result);
    }

    if (action === "promote-user") {
      if (!targetUserId || !newRole) {
        return NextResponse.json({ error: "targetUserId and newRole required" }, { status: 400 });
      }

      const validRoles = ["donor", "recipient", "hospital", "admin"];
      if (!validRoles.includes(newRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      await db.update(users)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(users.id, targetUserId));

      return NextResponse.json({ success: true, message: `User role updated to ${newRole}` });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error?.status) {
      return NextResponse.json({ error: error.error }, { status: error.status });
    }
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
