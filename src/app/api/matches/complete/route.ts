import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "hospital") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Get match with donor and recipient info
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: {
          columns: {
            userId: true,
            fullName: true,
          },
        },
        recipient: {
          columns: {
            userId: true,
            patientName: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const [updatedMatch] = await db
      .update(matches)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .returning();

    // Send notifications
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (match.donor?.userId) {
      await createNotification({
        userId: match.donor.userId,
        title: "Donation Completed",
        message: "The transplant procedure has been successfully completed. Thank you for saving a life!",
        type: "success",
        actionUrl: `${appUrl}/dashboard/donor`,
      });
    }

    if (match.recipient?.userId) {
      await createNotification({
        userId: match.recipient.userId,
        title: "Transplant Completed",
        message: "Your transplant procedure has been successfully completed. Wishing you a speedy recovery!",
        type: "success",
        actionUrl: `${appUrl}/dashboard/recipient`,
      });
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error("Error completing match:", error);
    return NextResponse.json({ error: "Failed to complete match" }, { status: 500 });
  }
}
