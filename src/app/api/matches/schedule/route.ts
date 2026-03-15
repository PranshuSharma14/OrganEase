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
    const { matchId, type, date } = body;

    if (!matchId || !type || !date) {
      return NextResponse.json(
        { error: "Match ID, type, and date are required" },
        { status: 400 }
      );
    }

    if (type !== "test" && type !== "procedure") {
      return NextResponse.json({ error: "Invalid schedule type" }, { status: 400 });
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

    const updateData: any = {};
    const scheduleDate = new Date(date);
    const formattedDate = scheduleDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    
    if (type === "test") {
      updateData.testScheduledDate = scheduleDate;
      // Don't change status - keep it as "approved"
    } else if (type === "procedure") {
      updateData.procedureScheduledDate = scheduleDate;
      // Don't change status - keep it as "approved"
    }

    console.log('Scheduling:', {
      matchId,
      type,
      date: scheduleDate,
      updateData,
    });

    const [updatedMatch] = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, matchId))
      .returning();

    console.log('Schedule updated successfully:', {
      matchId: updatedMatch.id,
      testScheduledDate: updatedMatch.testScheduledDate,
      procedureScheduledDate: updatedMatch.procedureScheduledDate,
      status: updatedMatch.status,
    });

    // Send notifications
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scheduleType = type === "test" ? "Medical Test" : "Transplant Procedure";

    if (match.donor?.userId) {
      await createNotification({
        userId: match.donor.userId,
        title: `${scheduleType} Scheduled`,
        message: `Your ${scheduleType.toLowerCase()} has been scheduled for ${formattedDate}.`,
        type: "info",
        actionUrl: `${appUrl}/dashboard/donor`,
      });
    }

    if (match.recipient?.userId) {
      await createNotification({
        userId: match.recipient.userId,
        title: `${scheduleType} Scheduled`,
        message: `Your ${scheduleType.toLowerCase()} has been scheduled for ${formattedDate}.`,
        type: "info",
        actionUrl: `${appUrl}/dashboard/recipient`,
      });
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error("Error scheduling:", error);
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}
