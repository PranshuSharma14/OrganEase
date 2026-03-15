import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificationTokens, users, hospitalProfiles } from "@/lib/db/schema";
import { randomInt } from "crypto";
import { createNotification } from "@/lib/notifications";
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

    // Send OTP via existing notification/email helper
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    try {
      await createNotification({
        userId: userId || null,
        title: "Your OrganEase verification code",
        message: `Your verification code is: ${otp}. It expires in 15 minutes.`,
        actionUrl: appUrl,
        email,
        sendEmail: true,
        type: "info",
      });
    } catch (e) {
      console.error("Failed to send OTP email:", e);
      // delete the token we just created to avoid leaving a valid token when email failed
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      return NextResponse.json({ error: "email_send_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in send-otp:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
