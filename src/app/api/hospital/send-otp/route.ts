import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificationTokens, users, hospitalProfiles } from "@/lib/db/schema";
import { randomInt } from "crypto";
import { sendOtpEmail } from "@/lib/notifications";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase();
    const userId = body.userId;

    if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

    // generate 6-digit OTP
    const otp = String(randomInt(100000, 999999));
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // remove any existing tokens for this identifier then store OTP
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
    await db.insert(verificationTokens).values({ identifier: email, token: otp, expires });

    // Send OTP via EmailJS with specialized template
    try {
      await sendOtpEmail({
        email,
        otpCode: otp,
        expiryTime: "15 minutes",
        appName: "OrganEase",
      });
    } catch (e) {
      console.error("Failed to send OTP email:", e);
      // Delete the token we just created to avoid leaving a valid token when email failed
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      return NextResponse.json({ error: "email_send_failed", details: String(e) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in send-otp:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
