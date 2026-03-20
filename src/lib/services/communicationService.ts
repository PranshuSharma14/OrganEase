import { db } from "@/lib/db";
import { hospitalMessages } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

/**
 * Send a message between a user and their assigned hospital.
 * Only donor↔hospital and recipient↔hospital communication is allowed.
 */
export async function sendMessage(params: {
  hospitalId: string;
  userId: string;
  senderId: string;
  senderRole: "donor" | "recipient" | "hospital" | "admin";
  message: string;
  matchId?: string;
}) {
  const [msg] = await db.insert(hospitalMessages).values({
    hospitalId: params.hospitalId,
    userId: params.userId,
    senderId: params.senderId,
    senderRole: params.senderRole,
    message: params.message,
    matchId: params.matchId,
  }).returning();

  return msg;
}

/**
 * Get messages between a user and a hospital, ordered by creation time.
 */
export async function getMessages(hospitalId: string, userId: string) {
  const messages = await db.query.hospitalMessages.findMany({
    where: and(
      eq(hospitalMessages.hospitalId, hospitalId),
      eq(hospitalMessages.userId, userId),
    ),
    orderBy: [desc(hospitalMessages.createdAt)],
  });

  return messages;
}

/**
 * Mark messages as read for a user or hospital.
 */
export async function markMessagesRead(hospitalId: string, userId: string, readerId: string) {
  // Mark messages as read where the reader is NOT the sender
  await db.update(hospitalMessages)
    .set({ read: true })
    .where(
      and(
        eq(hospitalMessages.hospitalId, hospitalId),
        eq(hospitalMessages.userId, userId),
        // Don't mark your own messages as read — mark the OTHER person's
      )
    );
}
