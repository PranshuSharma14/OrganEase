import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateConsentPDF } from "@/lib/pdf-generator";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Fetch match with full details
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: true,
        recipient: true,
        hospital: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Generate PDF data
    const pdfData = {
      matchId: match.id,
      donorName: match.donor.fullName,
      donorAge: match.donor.age,
      donorBloodGroup: match.donor.bloodGroup,
      donorCity: match.donor.city,
      recipientName: match.recipient.patientName,
      recipientAge: match.recipient.age,
      recipientBloodGroup: match.recipient.bloodGroup,
      recipientCity: match.recipient.city,
      organType: match.organType,
      hospitalName: match.hospital?.hospitalName || "Hospital",
      hospitalCity: match.hospital?.city || "City",
      approvedDate: match.approvedAt?.toISOString() || new Date().toISOString(),
      donorAcceptedDate: match.donorAcceptedAt?.toISOString() || "",
      recipientAcceptedDate: match.recipientAcceptedAt?.toISOString() || "",
    };

    const pdfUrl = await generateConsentPDF(pdfData);

    // If all parties have consented, update match with PDF URL
    if (match.donorAccepted && match.recipientAccepted && match.approvedByHospital) {
      await db.update(matches)
        .set({ 
          consentPdfUrl: pdfUrl,
          consentGeneratedAt: new Date(),
        })
        .where(eq(matches.id, matchId));
    }

    // Return the PDF URL as JSON
    return NextResponse.json({ pdfUrl, success: true });
  } catch (error) {
    console.error("Error generating consent PDF:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Fetch match with full details
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: true,
        recipient: true,
        hospital: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check if all parties have consented
    if (!match.donorAccepted || !match.recipientAccepted || !match.approvedByHospital) {
      return NextResponse.json({ 
        error: "All parties must consent before PDF generation" 
      }, { status: 400 });
    }

    // Generate PDF
    const pdfData = {
      matchId: match.id,
      donorName: match.donor.fullName,
      donorAge: match.donor.age,
      donorBloodGroup: match.donor.bloodGroup,
      donorCity: match.donor.city,
      recipientName: match.recipient.patientName,
      recipientAge: match.recipient.age,
      recipientBloodGroup: match.recipient.bloodGroup,
      recipientCity: match.recipient.city,
      organType: match.organType,
      hospitalName: match.hospital?.hospitalName || "Hospital",
      hospitalCity: match.hospital?.city || "City",
      approvedDate: match.approvedAt?.toISOString() || "",
      donorAcceptedDate: match.donorAcceptedAt?.toISOString() || "",
      recipientAcceptedDate: match.recipientAcceptedAt?.toISOString() || "",
    };

    const pdfUrl = await generateConsentPDF(pdfData);

    // Update match with PDF URL
    await db.update(matches)
      .set({ 
        consentPdfUrl: pdfUrl,
        consentGeneratedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    // Send notifications to all parties
    const { createNotification } = await import("@/lib/notifications");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Notify donor
    if (match.donor?.userId) {
      await createNotification({
        userId: match.donor.userId,
        title: "Consent PDF Generated",
        message: "The consent PDF has been generated and is available for download.",
        type: "success",
        actionUrl: `${appUrl}/dashboard/donor`,
      });
    }

    // Notify recipient
    if (match.recipient?.userId) {
      await createNotification({
        userId: match.recipient.userId,
        title: "Consent PDF Generated",
        message: "The consent PDF has been generated and is available for download.",
        type: "success",
        actionUrl: `${appUrl}/dashboard/recipient`,
      });
    }

    // Notify hospital
    if (match.hospital?.userId) {
      await createNotification({
        userId: match.hospital.userId,
        title: "Consent PDF Generated",
        message: "Consent PDF has been generated and is available for download.",
        type: "success",
        actionUrl: `${appUrl}/dashboard/hospital`,
      });
    }

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("Error generating consent PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
