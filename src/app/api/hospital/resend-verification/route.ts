import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verificationTokens, users, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    // Allow only authenticated hospital users to resend
    if (!session?.user || session.user.role !== "hospital") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const owner = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!owner) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    const hospital = await db.query.hospitalProfiles.findFirst({ where: eq(hospitalProfiles.userId, userId) });
    if (!hospital) return NextResponse.json({ error: "hospital_profile_not_found" }, { status: 404 });

    if (hospital.verified) {
      return NextResponse.json({ ok: true, message: "Already verified" });
    }

    const email = String(owner.email || hospital.email || "").toLowerCase();
    if (!email) return NextResponse.json({ error: "no_email" }, { status: 400 });

    const token = randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(verificationTokens).values({ identifier: email, token, expires });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/api/hospital/verify?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await createNotification({
        userId,
        title: "Resend: Verify your hospital email",
        message: `Please verify your hospital email by clicking the button.`,
        actionUrl: verifyUrl,
        email,
        sendEmail: true,
        type: "info",
      });
    } catch (e) {
      console.error("Failed to send resend verification email:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in resend verification:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
