import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { availability } = await req.json();

    if (!availability || !["active", "paused"].includes(availability)) {
      return NextResponse.json(
        { error: "Invalid availability status. Must be 'active' or 'paused'" },
        { status: 400 }
      );
    }

    // Update the donor's availability status
    await db
      .update(donorProfiles)
      .set({ availability: availability === "active" ? "active" : "paused" })
      .where(eq(donorProfiles.userId, session.user.id));

    return NextResponse.json({
      success: true,
      availability: availability,
      message: `Availability status updated to ${availability}`,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Failed to update availability status" },
      { status: 500 }
    );
  }
}
