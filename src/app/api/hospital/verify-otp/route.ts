import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificationTokens, users, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase();
    const otp = String(body.otp || "").trim();

    if (!email || !otp) return NextResponse.json({ error: "missing_params" }, { status: 400 });

    const vt = await db.query.verificationTokens.findFirst({ where: eq(verificationTokens.identifier, email) });
    if (!vt) {
      console.warn(`No verification token found for ${email}`);
      return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });
    }
    if (new Date(vt.expires) < new Date()) {
      console.warn(`Verification token expired for ${email}`);
      // delete expired token
      await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));
      return NextResponse.json({ error: "expired" }, { status: 400 });
    }
    if (vt.token !== otp) {
      console.warn(`Invalid OTP for ${email}: provided=${otp} expected=${vt.token}`);
      return NextResponse.json({ error: "invalid_otp" }, { status: 400 });
    }

    // find user by email and mark hospital profile verified
    const owner = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!owner) return NextResponse.json({ error: "no_user" }, { status: 404 });

    await db.update(hospitalProfiles).set({ verified: true, updatedAt: new Date() }).where(eq(hospitalProfiles.userId, owner.id));
    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, owner.id));

    // delete token
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
