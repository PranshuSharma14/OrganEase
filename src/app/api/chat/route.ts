import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hospitalMessages, hospitalProfiles, donorProfiles, recipientProfiles } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

// GET: Fetch messages between a user and their hospital
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");
    const userId = searchParams.get("userId");

    if (!hospitalId) {
      return NextResponse.json({ error: "Hospital ID required" }, { status: 400 });
    }

    const userRole = (session.user as any).role;
    const targetUserId = userId || session.user.id;

    // Hospital role can view messages with any of their registered users
    if (userRole === "hospital") {
      const hospitalProfile = await db.query.hospitalProfiles.findFirst({
        where: eq(hospitalProfiles.userId, session.user.id!),
      });

      if (!hospitalProfile || hospitalProfile.id !== hospitalId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      // Donor/Recipient can only view their own messages
      if (targetUserId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const messages = await db.query.hospitalMessages.findMany({
      where: and(
        eq(hospitalMessages.hospitalId, hospitalId),
        eq(hospitalMessages.userId, targetUserId!),
      ),
      orderBy: [desc(hospitalMessages.createdAt)],
    });

    // Reverse to get chronological order for display
    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST: Send a message (user ↔ hospital ONLY)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { hospitalId, userId, message, matchId } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userRole = (session.user as any).role;
    let targetHospitalId = hospitalId;
    let targetUserId = userId;

    if (userRole === "hospital") {
      // Hospital sending to a user
      const hospitalProfile = await db.query.hospitalProfiles.findFirst({
        where: eq(hospitalProfiles.userId, session.user.id!),
      });

      if (!hospitalProfile) {
        return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
      }

      targetHospitalId = hospitalProfile.id;

      if (!targetUserId) {
        return NextResponse.json({ error: "User ID required when hospital sends message" }, { status: 400 });
      }
    } else {
      // Donor/Recipient sending to their hospital
      targetUserId = session.user.id;

      if (!targetHospitalId) {
        // Look up the user's registered hospital
        const donorProfile = await db.query.donorProfiles.findFirst({
          where: eq(donorProfiles.userId, session.user.id!),
        });

        if (donorProfile?.registeredHospitalId) {
          targetHospitalId = donorProfile.registeredHospitalId;
        } else {
          const recipientProfile = await db.query.recipientProfiles.findFirst({
            where: eq(recipientProfiles.userId, session.user.id!),
          });
          if (recipientProfile?.registeredHospitalId) {
            targetHospitalId = recipientProfile.registeredHospitalId;
          }
        }
      }

      if (!targetHospitalId) {
        return NextResponse.json({ error: "No hospital assigned" }, { status: 400 });
      }
    }

    const [newMsg] = await db.insert(hospitalMessages).values({
      hospitalId: targetHospitalId,
      userId: targetUserId!,
      senderId: session.user.id!,
      senderRole: userRole as any,
      message: message.trim(),
      matchId: matchId || null,
    }).returning();

    return NextResponse.json({ message: newMsg }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
