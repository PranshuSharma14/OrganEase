import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/services/authService";
import { db } from "@/lib/db";
import { hospitalProfiles, users, donorProfiles, recipientProfiles, matches } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyHospital } from "@/lib/services/verificationService";

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

    // System stats
    const totalUsers = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const totalDonors = await db.select({ count: sql<number>`count(*)::int` }).from(donorProfiles);
    const totalRecipients = await db.select({ count: sql<number>`count(*)::int` }).from(recipientProfiles);
    const totalMatches = await db.select({ count: sql<number>`count(*)::int` }).from(matches);
    const pendingHospitals = hospitals.filter(h => h.verificationStatus === "pending");
    const verifiedHospitals = hospitals.filter(h => h.verificationStatus === "verified");

    const statsObj = {
      totalUsers: totalUsers[0]?.count ?? 0,
      totalDonors: totalDonors[0]?.count ?? 0,
      totalRecipients: totalRecipients[0]?.count ?? 0,
      totalMatches: totalMatches[0]?.count ?? 0,
      pendingHospitals: pendingHospitals.length,
      verifiedHospitals: verifiedHospitals.length,
      totalHospitals: hospitals.length,
    };
    console.log("Admin stats:", statsObj);

    return NextResponse.json({
      hospitals,
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
