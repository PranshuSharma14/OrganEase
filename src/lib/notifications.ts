import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type NotificationParams = {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  actionUrl?: string;
  email?: string;
  sendEmail?: boolean;
};

export async function createNotification(params: NotificationParams) {
  // Create in-app notification
  await db.insert(notifications).values({
    userId: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    actionUrl: params.actionUrl,
  });

  // Send email if requested and email provided
  if (params.sendEmail && params.email) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@organease.com",
        to: params.email,
        subject: params.title,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">${params.title}</h2>
            <p>${params.message}</p>
            ${params.actionUrl ? `<p><a href="${params.actionUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>` : ""}
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
            <p style="color: #6b7280; font-size: 12px;">OrganEase - Saving Lives Through Verified Donations</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  }
}

export async function notifyMatch(donorId: string, recipientId: string, hospitalId: string) {
  // Implementation for match notifications
}

export async function notifyApproval(matchId: string) {
  // Implementation for approval notifications
}
