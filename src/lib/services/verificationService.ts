import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, hospitalProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createAuditLog } from "@/lib/audit";

/**
 * Admin verifies a hospital (approve or reject)
 */
export async function verifyHospital(
  hospitalId: string,
  status: "verified" | "rejected",
  adminNotes: string,
  adminEmail: string
) {
  const hospital = await db.query.hospitalProfiles.findFirst({
    where: eq(hospitalProfiles.id, hospitalId),
  });

  if (!hospital) {
    throw { status: 404, error: "Hospital not found" };
  }

  await db.update(hospitalProfiles)
    .set({
      verified: status === "verified",
      verificationStatus: status,
      adminNotes,
      updatedAt: new Date(),
    })
    .where(eq(hospitalProfiles.id, hospitalId));

  await createAuditLog({
    userEmail: adminEmail,
    userRole: "admin",
    action: `hospital_${status}`,
    entity: "hospital",
    entityId: hospitalId,
    previousState: { verificationStatus: hospital.verificationStatus },
    newState: { verificationStatus: status },
    metadata: { adminNotes },
  });

  return { success: true, status };
}

/**
 * Hospital verifies a donor profile
 */
export async function verifyDonor(
  donorId: string,
  hospitalId: string,
  action: "approve" | "reject",
  hospitalEmail: string
) {
  const donor = await db.query.donorProfiles.findFirst({
    where: eq(donorProfiles.id, donorId),
  });

  if (!donor) {
    throw { status: 404, error: "Donor not found" };
  }

  // Ensure donor belongs to this hospital
  if (donor.registeredHospitalId && donor.registeredHospitalId !== hospitalId) {
    throw { status: 403, error: "This donor is not registered at your hospital" };
  }

  if (action === "approve") {
    await db.update(donorProfiles)
      .set({
        documentsVerified: true,
        verifiedByHospitalId: hospitalId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(donorProfiles.id, donorId));
  } else {
    await db.update(donorProfiles)
      .set({
        documentsVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(donorProfiles.id, donorId));
  }

  await createAuditLog({
    userEmail: hospitalEmail,
    userRole: "hospital",
    action: `donor_${action}d`,
    entity: "donor",
    entityId: donorId,
  });

  return { success: true, action };
}

/**
 * Hospital verifies a recipient profile
 */
export async function verifyRecipient(
  recipientId: string,
  hospitalId: string,
  action: "approve" | "reject",
  hospitalEmail: string
) {
  const recipient = await db.query.recipientProfiles.findFirst({
    where: eq(recipientProfiles.id, recipientId),
  });

  if (!recipient) {
    throw { status: 404, error: "Recipient not found" };
  }

  // Ensure recipient belongs to this hospital
  if (recipient.registeredHospitalId && recipient.registeredHospitalId !== hospitalId) {
    throw { status: 403, error: "This recipient is not registered at your hospital" };
  }

  if (action === "approve") {
    await db.update(recipientProfiles)
      .set({
        documentsVerified: true,
        verifiedByHospitalId: hospitalId,
        verifiedAt: new Date(),
        requestStatus: "verified",
        updatedAt: new Date(),
      })
      .where(eq(recipientProfiles.id, recipientId));
  } else {
    await db.update(recipientProfiles)
      .set({
        documentsVerified: false,
        requestStatus: "rejected",
        updatedAt: new Date(),
      })
      .where(eq(recipientProfiles.id, recipientId));
  }

  await createAuditLog({
    userEmail: hospitalEmail,
    userRole: "hospital",
    action: `recipient_${action}d`,
    entity: "recipient",
    entityId: recipientId,
  });

  return { success: true, action };
}
