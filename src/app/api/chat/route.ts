import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chatMessages, matches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET: Fetch messages for a match
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Verify user has access to this match
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: {
          columns: {
            userId: true,
          },
        },
        recipient: {
          columns: {
            userId: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if user is part of this match
    const isDonor = match.donor?.userId === session.user.id;
    const isRecipient = match.recipient?.userId === session.user.id;

    if (!isDonor && !isRecipient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if match is approved by hospital
    if (!match.approvedByHospital) {
      return NextResponse.json({ 
        error: "Match must be approved by hospital before chatting" 
      }, { status: 403 });
    }

    // Allow chat after hospital approval (both parties can chat even before accepting)
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.matchId, matchId),
      orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, message } = body;

    if (!matchId || !message) {
      return NextResponse.json(
        { error: "Match ID and message are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this match
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: {
          columns: {
            userId: true,
          },
        },
        recipient: {
          columns: {
            userId: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if user is part of this match
    const isDonor = match.donor?.userId === session.user.id;
    const isRecipient = match.recipient?.userId === session.user.id;

    if (!isDonor && !isRecipient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if match is approved by hospital
    if (!match.approvedByHospital) {
      return NextResponse.json({ 
        error: "Match must be approved by hospital before chatting" 
      }, { status: 403 });
    }

    // Allow chat after hospital approval (both parties can chat even before accepting)
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        matchId,
        senderId: session.user.id,
        senderRole: session.user.role as any,
        message: message.trim(),
        read: false,
      })
      .returning();

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PATCH: Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, userId } = body;

    if (!matchId || !userId) {
      return NextResponse.json(
        { error: "Match ID and user ID are required" },
        { status: 400 }
      );
    }

    await db
      .update(chatMessages)
      .set({ read: true })
      .where(
        and(
          eq(chatMessages.matchId, matchId),
          eq(chatMessages.senderId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Failed to update messages" }, { status: 500 });
  }
}
