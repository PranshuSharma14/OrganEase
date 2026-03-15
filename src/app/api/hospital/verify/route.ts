import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificationTokens, users, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = (searchParams.get("email") || "").toLowerCase();

    if (!token || !email) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 });
    }

    const vt = await db.query.verificationTokens.findFirst({ where: eq(verificationTokens.identifier, email) });
    if (!vt || vt.token !== token) {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(vt.expires) < now) {
      return NextResponse.json({ error: "token_expired" }, { status: 400 });
    }

    // Find user by email
    const owner = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!owner) {
      return NextResponse.json({ error: "no_user" }, { status: 404 });
    }

    // Mark user's email verified
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, owner.id));

    // Mark hospital profile verified where userId matches
    await db.update(hospitalProfiles).set({ verified: true, updatedAt: new Date() }).where(eq(hospitalProfiles.userId, owner.id));

    // Remove the token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    // Redirect to a confirmation page or return JSON
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/onboarding/hospital/verified`);
  } catch (error) {
    console.error("Error verifying hospital email:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Verify request from user:", { id: session.user.id, role: session.user.role });
    
    // Require hospital role for verification
    if (session.user.role !== "hospital") {
      console.error("Access denied - user role:", session.user.role);
      return NextResponse.json({ error: `Hospital access required. Current role: ${session.user.role}` }, { status: 403 });
    }

    // Get hospital profile ID
    const hospitalProfile = await db.query.hospitalProfiles.findFirst({
      where: eq(hospitalProfiles.userId, session.user.id),
    });

    if (!hospitalProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { profileId, profileType, action } = body;

    if (!profileId || !profileType || !action) {
      return NextResponse.json(
        { error: "Profile ID, type, and action are required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      if (profileType === "donor") {
        await db.update(donorProfiles)
          .set({
            documentsVerified: true,
            verifiedByHospitalId: hospitalProfile.id,
            verifiedAt: new Date(),
          })
          .where(eq(donorProfiles.id, profileId));
      } else if (profileType === "recipient") {
        await db.update(recipientProfiles)
          .set({
            documentsVerified: true,
            verifiedByHospitalId: hospitalProfile.id,
            verifiedAt: new Date(),
            requestStatus: "verified",
          })
          .where(eq(recipientProfiles.id, profileId));
      }
    } else if (action === "reject") {
      if (profileType === "donor") {
        await db.update(donorProfiles)
          .set({
            documentsVerified: false,
          })
          .where(eq(donorProfiles.id, profileId));
      } else if (profileType === "recipient") {
        await db.update(recipientProfiles)
          .set({
            documentsVerified: false,
            requestStatus: "rejected",
          })
          .where(eq(recipientProfiles.id, profileId));
      }
    }

    return NextResponse.json({ success: true, action, profileType });
  } catch (error) {
    console.error("Error verifying profile:", error);
    return NextResponse.json({ error: "Failed to verify profile" }, { status: 500 });
  }
}
