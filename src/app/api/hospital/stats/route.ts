import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, matches, hospitalProfiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ donors: [], recipients: [], matches: [] });
    }

    // Get hospital profile
    const hospitalProfile = await db.query.hospitalProfiles.findFirst({
      where: eq(hospitalProfiles.userId, session.user.id),
    });

    if (!hospitalProfile) {
      return NextResponse.json({ error: "Hospital profile not found" }, { status: 404 });
    }

    const hospitalId = hospitalProfile.id;

    // Get ALL donors (both verified and pending) for this hospital to review
    const allDonors = await db.select({
      id: donorProfiles.id,
      userId: donorProfiles.userId,
      fullName: donorProfiles.fullName,
      age: donorProfiles.age,
      bloodGroup: donorProfiles.bloodGroup,
      city: donorProfiles.city,
      state: donorProfiles.state,
      organs: donorProfiles.organs,
      availability: donorProfiles.availability,
      emergencyAvailable: donorProfiles.emergencyAvailable,
      aadhaarUrl: donorProfiles.aadhaarUrl,
      medicalCertificateUrl: donorProfiles.medicalCertificateUrl,
      consentForm: donorProfiles.consentForm,
      bloodGroupReport: donorProfiles.bloodGroupReport,
      documentsVerified: donorProfiles.documentsVerified,
      verifiedByHospitalId: donorProfiles.verifiedByHospitalId,
      verifiedAt: donorProfiles.verifiedAt,
      createdAt: donorProfiles.createdAt,
      email: users.email,
    })
    .from(donorProfiles)
    .leftJoin(users, eq(donorProfiles.userId, users.id));

    // Get recipients registered with THIS hospital
    const hospitalRecipients = await db.select({
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
      registeredHospitalId: recipientProfiles.registeredHospitalId,
      createdAt: recipientProfiles.createdAt,
      email: users.email,
    })
    .from(recipientProfiles)
    .leftJoin(users, eq(recipientProfiles.userId, users.id))
    .where(eq(recipientProfiles.registeredHospitalId, hospitalId));

    // Get matches for this hospital
    const hospitalMatches = await db.query.matches.findMany({
      where: eq(matches.hospitalId, hospitalId),
    });

    return NextResponse.json({
      donors: allDonors,
      recipients: hospitalRecipients,
      matches: hospitalMatches,
    });
  } catch (error) {
    console.error("Error fetching hospital stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
