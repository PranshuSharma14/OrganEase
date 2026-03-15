import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import emailjs from "@emailjs/nodejs";

// Initialize EmailJS with both public and private keys for server-side strict mode
emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

type NotificationParams = {
  userId?: string | null;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  actionUrl?: string;
  email?: string;
  sendEmail?: boolean;
};

export async function createNotification(params: NotificationParams) {
  // Create in-app notification only if userId is available
  if (params.userId) {
    try {
      await db.insert(notifications).values({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        actionUrl: params.actionUrl,
      });
    } catch (error) {
      console.error("Failed to create in-app notification:", error);
      // Continue to send email even if in-app notification fails
    }
  } else {
    console.log("No userId provided, skipping in-app notification");
  }

  // Send email if requested and email provided
  // Email should be sent regardless of in-app notification success/failure
  if (params.sendEmail && params.email) {
    try {
      await emailjs.send(
        process.env.EMAILJS_SERVICE_ID!,
        process.env.EMAILJS_TEMPLATE_ID!,
        {
          to_email: params.email,
          subject: params.title,
          message: params.message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">${params.title}</h2>
              <p>${params.message}</p>
              ${params.actionUrl ? `<p><a href="${params.actionUrl}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a></p>` : ""}
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;"/>
              <p style="color: #6b7280; font-size: 12px;">OrganEase - Saving Lives Through Verified Donations</p>
            </div>
          `,
        }
      );
    } catch (error) {
      console.error("Failed to send email via EmailJS:", error);
      throw error; // Re-throw so caller knows email sending failed
    }
  }
}

// Specialized function for sending OTP emails
export async function sendOtpEmail(params: {
  email: string;
  otpCode: string;
  expiryTime: string;
  appName?: string;
}) {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        to_email: params.email,
        app_name: params.appName || "OrganEase",
        otp_code: params.otpCode,
        expiry_time: params.expiryTime,
      }
    );
  } catch (error) {
    console.error("Failed to send OTP email via EmailJS:", error);
    throw error;
  }
}

export async function notifyMatch(donorId: string, recipientId: string, hospitalId: string) {
  // Implementation for match notifications
}

export async function notifyApproval(matchId: string) {
  // Implementation for approval notifications
}
