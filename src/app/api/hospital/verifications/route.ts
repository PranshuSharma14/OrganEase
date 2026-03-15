import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, users, hospitalProfiles } from "@/lib/db/schema";
import { createNotification } from "@/lib/notifications";
import { eq, and } from "drizzle-orm";
import { findMatches, createMatch } from "@/lib/matching-engine";

// GET: Fetch pending verifications OR validate a hospital code
// - /api/hospital/verifications               → pending verifications list
// - /api/hospital/verifications?validateCode=HOSP-XXXX → validate a hospital code
export async function GET(request: NextRequest) {
  try {
    // --- Hospital code validation (no auth required) ---
    const { searchParams } = new URL(request.url);
    const codeToValidate = searchParams.get("validateCode");
    if (codeToValidate) {
      const code = codeToValidate.toUpperCase().trim();
      const hospital = await db.query.hospitalProfiles.findFirst({
        where: eq(hospitalProfiles.hospitalCode, code),
        columns: { id: true, hospitalName: true, city: true, state: true },
      });
      if (!hospital) {
        return NextResponse.json({ valid: false, error: "Invalid hospital code" });
      }
      return NextResponse.json({
        valid: true,
        hospitalId: hospital.id,
        hospitalName: hospital.hospitalName,
        city: hospital.city,
        state: hospital.state,
      });
    }

    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ pending: [] });
    }

    // Require hospital role and verified account
    if (session.user.role !== "hospital") {
      return NextResponse.json({ pending: [] });
    }

    const hospitalProfile = await db.query.hospitalProfiles.findFirst({ where: eq(hospitalProfiles.userId, session.user.id) });
    if (!hospitalProfile) {
      // No hospital profile found for this user
      return NextResponse.json({ pending: [] });
    }

    // Get unverified donor profiles with user details
    const pendingDonors = await db.select({
      id: donorProfiles.id,
      userId: donorProfiles.userId,
      fullName: donorProfiles.fullName,
      age: donorProfiles.age,
      bloodGroup: donorProfiles.bloodGroup,
      city: donorProfiles.city,
      state: donorProfiles.state,
      organs: donorProfiles.organs,
      aadhaarUrl: donorProfiles.aadhaarUrl,
      medicalCertificateUrl: donorProfiles.medicalCertificateUrl,
      documentsVerified: donorProfiles.documentsVerified,
      createdAt: donorProfiles.createdAt,
      email: users.email,
    })
    .from(donorProfiles)
    .leftJoin(users, eq(donorProfiles.userId, users.id))
    .where(eq(donorProfiles.documentsVerified, false));

    // Get unverified recipient profiles linked to THIS hospital only
    const pendingRecipients = await db.select({
      id: recipientProfiles.id,
      userId: recipientProfiles.userId,
      patientName: recipientProfiles.patientName,
      age: recipientProfiles.age,
      bloodGroup: recipientProfiles.bloodGroup,
      requiredOrgan: recipientProfiles.requiredOrgan,
      city: recipientProfiles.city,
      state: recipientProfiles.state,
      priority: recipientProfiles.priority,
      hospitalLetterUrl: recipientProfiles.hospitalLetterUrl,
      medicalReportUrl: recipientProfiles.medicalReportUrl,
      insuranceCardUrl: recipientProfiles.insuranceCardUrl,
      governmentIdUrl: recipientProfiles.governmentIdUrl,
      documentsVerified: recipientProfiles.documentsVerified,
      requestStatus: recipientProfiles.requestStatus,
      createdAt: recipientProfiles.createdAt,
      email: users.email,
    })
    .from(recipientProfiles)
    .leftJoin(users, eq(recipientProfiles.userId, users.id))
    .where(and(
      eq(recipientProfiles.documentsVerified, false),
      eq(recipientProfiles.registeredHospitalId, hospitalProfile.id)
    ));

    const pending = [
      ...pendingDonors.map(d => ({ ...d, type: "donor", fullName: d.fullName })),
      ...pendingRecipients.map(r => ({ ...r, type: "recipient", fullName: r.patientName }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`Returning ${pending.length} pending verifications to hospital ${hospitalProfile.id} (verified=${Boolean(hospitalProfile.verified)})`);

    return NextResponse.json({ pending, hospitalVerified: Boolean(hospitalProfile.verified) });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}

// POST: Approve or reject a pending donor/recipient profile
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Require hospital role for verification
    if (session.user.role !== "hospital") {
      return NextResponse.json({ error: `Hospital access required. Current role: ${session.user.role}` }, { status: 403 });
    }

    // Get hospital profile ID
    const hospitalProfile = await db.query.hospitalProfiles.findFirst({
      where: eq(hospitalProfiles.userId, session.user.id),
    });

    if (!hospitalProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { profileId, profileType, action } = body;

    if (!profileId || !profileType || !action) {
      return NextResponse.json(
        { error: "Profile ID, type, and action are required" },
        { status: 400 }
      );
    }

    // Security: ensure hospital can only act on recipients registered with them
    if (profileType === "recipient") {
      const recipient = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.id, profileId),
        columns: { registeredHospitalId: true },
      });
      if (!recipient || recipient.registeredHospitalId !== hospitalProfile.id) {
        return NextResponse.json({ error: "Access denied: recipient is not registered with your hospital" }, { status: 403 });
      }
    }

    if (action === "approve") {
      if (profileType === "donor") {
        await db.update(donorProfiles)
          .set({
            documentsVerified: true,
            verifiedByHospitalId: hospitalProfile.id,
            verifiedAt: new Date(),
          })
          .where(eq(donorProfiles.id, profileId));
        // notify donor (use helper to match notifications schema)
        const owner = await db.query.donorProfiles.findFirst({ where: eq(donorProfiles.id, profileId), columns: { userId: true } });
        if (owner) {
          await createNotification({
            userId: owner.userId,
            title: 'Documents verified',
            message: `Your donor documents were approved by ${hospitalProfile.hospitalName || 'the hospital'}`,
            type: 'success',
            actionUrl: undefined,
            sendEmail: false,
          });
        }
        
        // Auto-create matches when donor is verified - check all verified recipients
        try {
          const donor = await db.query.donorProfiles.findFirst({
            where: eq(donorProfiles.id, profileId),
          });
          
          if (donor) {
            const verifiedRecipients = await db.query.recipientProfiles.findMany({
              where: eq(recipientProfiles.documentsVerified, true),
            });
            
            for (const recipient of verifiedRecipients) {
              const donorOrgans = donor.organs as string[];
              if (Array.isArray(donorOrgans) && donorOrgans.includes(recipient.requiredOrgan)) {
                if (donor.bloodGroup === recipient.bloodGroup) {
                  const potentialMatches = await findMatches(recipient.id);
                  const match = potentialMatches.find(m => m.donorId === donor.id);
                  if (match) {
                    await createMatch(
                      match.donorId,
                      match.recipientId,
                      match.organType,
                      match.score
                    );
                    console.log('Auto-created match for verified donor:', {
                      donorId: match.donorId,
                      recipientId: match.recipientId,
                      organType: match.organType,
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error auto-creating match for donor:', error);
        }
      } else if (profileType === "recipient") {
        await db.update(recipientProfiles)
          .set({
            documentsVerified: true,
            verifiedByHospitalId: hospitalProfile.id,
            verifiedAt: new Date(),
            requestStatus: "verified",
          })
          .where(eq(recipientProfiles.id, profileId));
        // notify recipient
        const owner = await db.query.recipientProfiles.findFirst({ where: eq(recipientProfiles.id, profileId), columns: { userId: true } });
        if (owner) {
          await createNotification({
            userId: owner.userId,
            title: 'Request verified',
            message: `Your recipient request was approved by ${hospitalProfile.hospitalName || 'the hospital'}`,
            type: 'success',
            actionUrl: undefined,
            sendEmail: false,
          });
        }
        
        // Auto-create matches when recipient is verified
        try {
          const recipient = await db.query.recipientProfiles.findFirst({
            where: eq(recipientProfiles.id, profileId),
          });
          
          if (recipient) {
            const potentialMatches = await findMatches(recipient.id);
            if (potentialMatches.length > 0) {
              // Create match with best candidate
              const bestMatch = potentialMatches[0];
              await createMatch(
                bestMatch.donorId,
                bestMatch.recipientId,
                bestMatch.organType,
                bestMatch.score
              );
              console.log('Auto-created match:', {
                donorId: bestMatch.donorId,
                recipientId: bestMatch.recipientId,
                organType: bestMatch.organType,
              });
            }
          }
        } catch (error) {
          console.error('Error auto-creating match:', error);
        }
      }
    } else if (action === "reject") {
      if (profileType === "donor") {
        await db.update(donorProfiles)
          .set({
            documentsVerified: false,
          })
          .where(eq(donorProfiles.id, profileId));
        // notify donor of rejection
        const owner = await db.query.donorProfiles.findFirst({ where: eq(donorProfiles.id, profileId), columns: { userId: true } });
        if (owner) {
          await createNotification({
            userId: owner.userId,
            title: 'Documents rejected',
            message: `Your donor documents were rejected by ${hospitalProfile.hospitalName || 'the hospital'}`,
            type: 'warning',
            actionUrl: undefined,
            sendEmail: false,
          });
        }
      } else if (profileType === "recipient") {
        await db.update(recipientProfiles)
          .set({
            documentsVerified: false,
            requestStatus: "rejected",
          })
          .where(eq(recipientProfiles.id, profileId));
        // notify recipient of rejection
        const owner = await db.query.recipientProfiles.findFirst({ where: eq(recipientProfiles.id, profileId), columns: { userId: true } });
        if (owner) {
          await createNotification({
            userId: owner.userId,
            title: 'Request rejected',
            message: `Your recipient request was rejected by ${hospitalProfile.hospitalName || 'the hospital'}`,
            type: 'warning',
            actionUrl: undefined,
            sendEmail: false,
          });
        }
      }
    }

    // Return updated profile for UI to refresh
    if (profileType === 'donor') {
      const updated = await db.query.donorProfiles.findFirst({ where: eq(donorProfiles.id, profileId) });
      return NextResponse.json({ success: true, action, profileType, profile: updated });
    }
    if (profileType === 'recipient') {
      const updated = await db.query.recipientProfiles.findFirst({ where: eq(recipientProfiles.id, profileId) });
      return NextResponse.json({ success: true, action, profileType, profile: updated });
    }

    return NextResponse.json({ success: true, action, profileType });
  } catch (error) {
    console.error("Error verifying profile:", error);
    return NextResponse.json({ error: "Failed to verify profile" }, { status: 500 });
  }
}
