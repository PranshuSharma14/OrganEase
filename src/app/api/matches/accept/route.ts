import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { matches, donorProfiles, recipientProfiles, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error('Accept match failed: No session');
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    console.log('Accept match request:', {
      userId: session.user.id,
      userRole: session.user.role,
      userEmail: session.user.email,
    });

    const body = await request.json();
    const { matchId, accepted } = body;

    console.log('Accept match body:', { matchId, accepted });

    if (!matchId || typeof accepted !== "boolean") {
      console.error('Accept match failed: Invalid parameters', { matchId, accepted });
      return NextResponse.json(
        { error: "Match ID and accepted status are required" },
        { status: 400 }
      );
    }

    // Get the match with relations
    const match = await db.query.matches.findFirst({
      where: eq(matches.id, matchId),
      with: {
        donor: {
          columns: {
            id: true,
            userId: true,
            fullName: true,
          },
        },
        recipient: {
          columns: {
            id: true,
            userId: true,
            patientName: true,
          },
        },
      },
    });

    if (!match) {
      console.error('Accept match failed: Match not found', { matchId });
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    console.log('Match found:', {
      matchId: match.id,
      donorId: match.donorId,
      donorUserId: match.donor?.userId,
      recipientId: match.recipientId,
      recipientUserId: match.recipient?.userId,
      approvedByHospital: match.approvedByHospital,
    });

    // Check if match is approved by hospital
    if (!match.approvedByHospital) {
      console.error('Accept match failed: Not approved by hospital', { matchId });
      return NextResponse.json(
        { error: "Match must be approved by hospital first" },
        { status: 400 }
      );
    }

    // Get user's profile ID
    let profileId: string | null = null;
    if (session.user.role === "donor") {
      const donorProfile = await db.query.donorProfiles.findFirst({
        where: eq(donorProfiles.userId, session.user.id),
        columns: { id: true },
      });
      profileId = donorProfile?.id || null;
      console.log('Donor profile lookup:', {
        userId: session.user.id,
        profileId,
        matchDonorId: match.donorId,
        matches: profileId === match.donorId,
      });
      if (profileId !== match.donorId) {
        console.error('Accept match failed: Donor profile mismatch', {
          profileId,
          matchDonorId: match.donorId,
        });
        return NextResponse.json({ error: "Unauthorized - Profile mismatch" }, { status: 403 });
      }
    } else if (session.user.role === "recipient") {
      const recipientProfile = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.userId, session.user.id),
        columns: { id: true },
      });
      profileId = recipientProfile?.id || null;
      console.log('Recipient profile lookup:', {
        userId: session.user.id,
        profileId,
        matchRecipientId: match.recipientId,
        matches: profileId === match.recipientId,
      });
      if (profileId !== match.recipientId) {
        console.error('Accept match failed: Recipient profile mismatch', {
          profileId,
          matchRecipientId: match.recipientId,
        });
        return NextResponse.json({ error: "Unauthorized - Profile mismatch" }, { status: 403 });
      }
    } else {
      console.error('Accept match failed: Invalid role', { role: session.user.role });
      return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 403 });
    }

    // Update based on user role
    const updateData: any = {};
    
    if (session.user.role === "donor") {
      updateData.donorAccepted = accepted;
      updateData.donorAcceptedAt = accepted ? new Date() : null;
    } else if (session.user.role === "recipient") {
      updateData.recipientAccepted = accepted;
      updateData.recipientAcceptedAt = accepted ? new Date() : null;
    }

    // Check if both parties will have accepted after this update
    const willBothAccept = 
      (session.user.role === "donor" && accepted && match.recipientAccepted) ||
      (session.user.role === "recipient" && accepted && match.donorAccepted);

    // Don't change status - keep it as "approved" even when both accept
    // Status only changes to "completed" when hospital marks procedure as complete

    console.log('Updating match:', {
      matchId,
      updateData,
      willBothAccept,
      currentDonorAccepted: match.donorAccepted,
      currentRecipientAccepted: match.recipientAccepted,
    });

    const [updatedMatch] = await db
      .update(matches)
      .set(updateData)
      .where(eq(matches.id, matchId))
      .returning();

    console.log('Match updated successfully:', {
      matchId: updatedMatch.id,
      donorAccepted: updatedMatch.donorAccepted,
      recipientAccepted: updatedMatch.recipientAccepted,
      status: updatedMatch.status,
    });

    // Send notifications
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    if (session.user.role === "donor" && accepted) {
      // Notify recipient
      if (match.recipient?.userId) {
        await createNotification({
          userId: match.recipient.userId,
          title: "Donor Accepted Match",
          message: `The donor has accepted the match. ${willBothAccept ? "Both parties have now accepted - chat is now enabled!" : "Waiting for your acceptance to enable chat."}`,
          type: "success",
          actionUrl: `${appUrl}/dashboard/recipient`,
        });
      }

      // Notify donor
      await createNotification({
        userId: session.user.id,
        title: "Match Accepted",
        message: `You have accepted the match. ${willBothAccept ? "Both parties have accepted - chat is now enabled!" : "Waiting for recipient acceptance."}`,
        type: "success",
        actionUrl: `${appUrl}/dashboard/donor`,
      });
    } else if (session.user.role === "recipient" && accepted) {
      // Notify donor
      if (match.donor?.userId) {
        await createNotification({
          userId: match.donor.userId,
          title: "Recipient Accepted Match",
          message: `The recipient has accepted the match. ${willBothAccept ? "Both parties have now accepted - chat is now enabled!" : "Waiting for your acceptance to enable chat."}`,
          type: "success",
          actionUrl: `${appUrl}/dashboard/donor`,
        });
      }

      // Notify recipient
      await createNotification({
        userId: session.user.id,
        title: "Match Accepted",
        message: `You have accepted the match. ${willBothAccept ? "Both parties have accepted - chat is now enabled!" : "Waiting for donor acceptance."}`,
        type: "success",
        actionUrl: `${appUrl}/dashboard/recipient`,
      });
    }

    // If both accepted, trigger consent PDF generation via API and notify all parties
    if (willBothAccept) {
      // Notify all parties that chat is enabled
      if (match.donor?.userId) {
        await createNotification({
          userId: match.donor.userId,
          title: "Chat Enabled",
          message: "Both parties have accepted the match. Chat is now enabled and consent PDF can be generated.",
          type: "success",
          actionUrl: `${appUrl}/dashboard/donor`,
        });
      }

      if (match.recipient?.userId) {
        await createNotification({
          userId: match.recipient.userId,
          title: "Chat Enabled",
          message: "Both parties have accepted the match. Chat is now enabled and consent PDF can be generated.",
          type: "success",
          actionUrl: `${appUrl}/dashboard/recipient`,
        });
      }

      // Notify hospital
      if (match.hospitalId) {
        const hospitalProfile = await db.query.hospitalProfiles.findFirst({
          where: eq(hospitalProfiles.id, match.hospitalId),
          columns: { userId: true },
        });
        
        if (hospitalProfile) {
          await createNotification({
            userId: hospitalProfile.userId,
            title: "Match Fully Accepted",
            message: "Both donor and recipient have accepted the match. You can now generate the consent PDF.",
            type: "success",
            actionUrl: `${appUrl}/dashboard/hospital`,
          });
        }
      }

      // Auto-generate consent PDF in background (don't block the response)
      // Use setImmediate to run after response is sent
      setImmediate(async () => {
        try {
          const { generateConsentPDF } = await import("@/lib/pdf-generator");
          
          // Get full match details for PDF
          const fullMatch = await db.query.matches.findFirst({
            where: eq(matches.id, matchId),
            with: {
              donor: true,
              recipient: true,
              hospital: true,
            },
          });

          if (fullMatch && fullMatch.donor && fullMatch.recipient) {
            const pdfData = {
              matchId: fullMatch.id,
              donorName: fullMatch.donor.fullName,
              donorAge: fullMatch.donor.age,
              donorBloodGroup: fullMatch.donor.bloodGroup,
              donorCity: fullMatch.donor.city,
              recipientName: fullMatch.recipient.patientName,
              recipientAge: fullMatch.recipient.age,
              recipientBloodGroup: fullMatch.recipient.bloodGroup,
              recipientCity: fullMatch.recipient.city,
              organType: fullMatch.organType,
              hospitalName: fullMatch.hospital?.hospitalName || "Hospital",
              hospitalCity: fullMatch.hospital?.city || "City",
              approvedDate: fullMatch.approvedAt?.toISOString() || new Date().toISOString(),
              donorAcceptedDate: updatedMatch.donorAcceptedAt?.toISOString() || new Date().toISOString(),
              recipientAcceptedDate: updatedMatch.recipientAcceptedAt?.toISOString() || new Date().toISOString(),
            };

            const pdfUrl = await generateConsentPDF(pdfData);

            // Update match with PDF URL
            await db.update(matches)
              .set({ 
                consentPdfUrl: pdfUrl,
                consentGeneratedAt: new Date(),
              })
              .where(eq(matches.id, matchId));

            // Notify all parties about consent PDF
            if (match.donor?.userId) {
              await createNotification({
                userId: match.donor.userId,
                title: "Consent PDF Generated",
                message: "The consent PDF has been automatically generated and is available for download.",
                type: "success",
                actionUrl: `${appUrl}/dashboard/donor`,
              });
            }

            if (match.recipient?.userId) {
              await createNotification({
                userId: match.recipient.userId,
                title: "Consent PDF Generated",
                message: "The consent PDF has been automatically generated and is available for download.",
                type: "success",
                actionUrl: `${appUrl}/dashboard/recipient`,
              });
            }

            if (match.hospitalId) {
              const hospitalProfile = await db.query.hospitalProfiles.findFirst({
                where: eq(hospitalProfiles.id, match.hospitalId),
                columns: { userId: true },
              });
              
              if (hospitalProfile) {
                await createNotification({
                  userId: hospitalProfile.userId,
                  title: "Consent PDF Generated",
                  message: "Consent PDF has been automatically generated and is available for download.",
                  type: "success",
                  actionUrl: `${appUrl}/dashboard/hospital`,
                });
              }
            }
          }
        } catch (error) {
          console.error("Background PDF generation failed:", error);
        }
      });
    }

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error("Error accepting match:", error);
    return NextResponse.json({ error: "Failed to accept match" }, { status: 500 });
  }
}
