import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, hospitalProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { verificationTokens } from "@/lib/db/schema";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    // We'll fetch the profile owner's email later (don't assume it's the same as the viewer's session)

    if (role === "donor") {
      try {
        // Select commonly used donor fields explicitly. Some deployments
        // may not have every historically added column (e.g. blood_group_report),
        // so we avoid selecting that column here to prevent SQL errors.
        const donor = await db.query.donorProfiles.findFirst({
          where: eq(donorProfiles.userId, session.user.id),
          columns: {
            id: true,
            userId: true,
            fullName: true,
            age: true,
            bloodGroup: true,
            city: true,
            state: true,
            organs: true,
            availability: true,
            emergencyAvailable: true,
            aadhaarUrl: true,
            medicalCertificateUrl: true,
            consentForm: true,
            bloodGroupReport: true,
            documentsVerified: true,
            verifiedByHospitalId: true,
            verifiedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        let donorWithDocs = {};
        if (donor) {
          const owner = await db.query.users.findFirst({ where: eq(users.id, donor.userId) });
          
          // Look up the linked hospital
          let hospitalData: any = {};
          if (donor.verifiedByHospitalId) {
            const hospital = await db.query.hospitalProfiles.findFirst({
              where: eq(hospitalProfiles.id, donor.verifiedByHospitalId),
              columns: { hospitalName: true, city: true, state: true },
            });
            if (hospital) {
              hospitalData = {
                hospitalName: hospital.hospitalName,
                hospitalCity: hospital.city,
                hospitalState: hospital.state,
              };
            }
          }

          donorWithDocs = {
            ...donor,
            email: owner?.email || "",
            governmentId: donor.aadhaarUrl || "",
            medicalCertificate: donor.medicalCertificateUrl || "",
            bloodGroupReport: donor.bloodGroupReport || "",
            consentForm: donor.consentForm || "",
            ...hospitalData,
          };
        }

        return NextResponse.json(donorWithDocs);
      } catch (err: any) {
        console.warn("Donor profile fetch failed:", err?.message || err);
        return NextResponse.json({ error: "db_error", message: String(err?.message || err) }, { status: 500 });
      }
    }

    if (role === "recipient") {
      const recipient = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.userId, session.user.id),
      });

      let recipientWithEmail = {};
      if (recipient) {
        const owner = await db.query.users.findFirst({ where: eq(users.id, recipient.userId) });
        recipientWithEmail = { ...recipient, email: owner?.email || "" };
      }

      return NextResponse.json(recipientWithEmail);
    }

    if (role === "hospital") {
        // Fetch hospital profile for current session user
        const hospital = await db.query.hospitalProfiles.findFirst({
          where: eq(hospitalProfiles.userId, session.user.id),
        });

      let hospitalWithEmail = {};
      if (hospital) {
        const owner = await db.query.users.findFirst({ where: eq(users.id, hospital.userId) });
        hospitalWithEmail = { ...hospital, email: owner?.email || "" };
      }

      return NextResponse.json(hospitalWithEmail);
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, userId, ...data } = body;

    // Allow creating profile with userId from onboarding (no session required)
    let effectiveUserId = userId;
    
    // If no userId provided, try to get from session
    if (!effectiveUserId) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized - userId or session required" }, { status: 401 });
      }
      effectiveUserId = session.user.id;
    }

    if (role === "donor") {
      // Check if profile exists (select only id to avoid missing-column errors)
      const existingDonor = await db.query.donorProfiles.findFirst({
        where: eq(donorProfiles.userId, effectiveUserId),
        columns: { id: true, userId: true },
      });

      if (existingDonor) {
        // Update existing profile
        const [donor] = await db.update(donorProfiles)
          .set({
            fullName: data.fullName,
            age: data.age,
            bloodGroup: data.bloodGroup,
            city: data.city,
            state: data.state,
            organs: data.organs,
            availability: data.availability || "active",
            emergencyAvailable: data.emergencyAvailable || false,
            aadhaarUrl: data.governmentId,
            medicalCertificateUrl: data.medicalCertificate,
              bloodGroupReport: data.bloodGroupReport,
            consentForm: data.consentForm,
            updatedAt: new Date(),
          })
          .where(eq(donorProfiles.userId, effectiveUserId))
          .returning();
        return NextResponse.json(donor);
      } else {
        // Insert new profile
        const [donor] = await db.insert(donorProfiles).values({
          userId: effectiveUserId,
          fullName: data.fullName,
          age: data.age,
          bloodGroup: data.bloodGroup,
          city: data.city,
          state: data.state,
          organs: data.organs,
          availability: data.availability || "active",
          emergencyAvailable: data.emergencyAvailable || false,
          aadhaarUrl: data.governmentId,
          medicalCertificateUrl: data.medicalCertificate,
            bloodGroupReport: data.bloodGroupReport,
          consentForm: data.consentForm,
        }).returning();
        return NextResponse.json(donor);
      }
    }

    if (role === "recipient") {
      // Check if profile exists (select only id)
      const existingRecipient = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.userId, effectiveUserId),
        columns: { id: true, userId: true },
      });

      // Resolve hospitalCode → registeredHospitalId
      let registeredHospitalId: string | null = null;
      if (data.hospitalCode) {
        const hospital = await db.query.hospitalProfiles.findFirst({
          where: eq(hospitalProfiles.hospitalCode, data.hospitalCode.toUpperCase().trim()),
          columns: { id: true },
        });
        if (!hospital) {
          return NextResponse.json({ error: "Invalid hospital code. Please check and try again." }, { status: 400 });
        }
        registeredHospitalId = hospital.id;
      }

      const recipientData = {
        patientName: data.fullName,
        age: parseInt(data.dateOfBirth ? new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear() : data.age || "0"),
        bloodGroup: data.bloodGroup,
        requiredOrgan: data.organNeeded,
        city: data.city,
        state: data.state,
        medicalReportUrl: data.medicalReports,
        hospitalLetterUrl: data.doctorReferral,
        insuranceCardUrl: data.insuranceCard,
        governmentIdUrl: data.governmentId,
        priority: data.urgencyLevel === "high" || data.urgencyLevel === "emergency" ? data.urgencyLevel : "normal",
        ...(registeredHospitalId ? { registeredHospitalId } : {}),
      };

      if (existingRecipient) {
        // Update existing profile
        const [recipient] = await db.update(recipientProfiles)
          .set({ ...recipientData, updatedAt: new Date() })
          .where(eq(recipientProfiles.userId, effectiveUserId))
          .returning();
        return NextResponse.json(recipient);
      } else {
        // Insert new profile
        const [recipient] = await db.insert(recipientProfiles)
          .values({ userId: effectiveUserId, ...recipientData })
          .returning();
        return NextResponse.json(recipient);
      }
    }

    if (role === "hospital") {
      // Check if profile exists (select only id)
      const existingHospital = await db.query.hospitalProfiles.findFirst({
        where: eq(hospitalProfiles.userId, effectiveUserId),
        columns: { id: true, userId: true },
      });

      const hospitalData = {
        hospitalName: data.hospitalName,
        registrationNumber: data.registrationNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        // Primary public phone (as entered on form)
        phoneNumber: data.phoneNumber || null,
        email: data.email || null,
        website: data.website || null,
        accreditation: data.accreditation || null,
        // Contact number is required - use phoneNumber if contactNumber not provided
        contactNumber: data.contactNumber || data.phoneNumber || "",
        // Coordinator fields: prefer explicit coordinator values, fallback to department head/email
        // Both are required (NOT NULL) - provide fallbacks
        coordinatorName: data.coordinatorName || data.transplantDepartmentHead || data.hospitalName || "Coordinator",
        coordinatorEmail: data.coordinatorEmail || data.departmentEmail || data.email || "coordinator@hospital.com",
        // Department-specific fields
        transplantDepartmentHead: data.transplantDepartmentHead || null,
        departmentPhone: data.departmentPhone || null,
        departmentEmail: data.departmentEmail || null,
        numberOfTransplantSurgeons: data.numberOfTransplantSurgeons ? parseInt(data.numberOfTransplantSurgeons) : null,
        transplantCapacity: data.transplantCapacity ? parseInt(data.transplantCapacity) : null,
        specializations: data.specializations || [],
        verificationDocUrl: data.hospitalLicense || null,
        licenseDocUrl: data.hospitalLicense || null,
        accreditationDocUrl: data.accreditationCertificate || null,
      };

      if (existingHospital) {
        // Update existing profile
        const [hospital] = await db.update(hospitalProfiles)
          .set({ ...hospitalData, updatedAt: new Date() })
          .where(eq(hospitalProfiles.userId, effectiveUserId))
          .returning();

        // Send verification email if not verified
        if (!hospital.verified) {
          try {
            const owner = await db.query.users.findFirst({ where: eq(users.id, effectiveUserId) });
            const email = owner?.email || data.email;
            const token = randomBytes(24).toString("hex");
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            await db.insert(verificationTokens).values({ identifier: String(email).toLowerCase(), token, expires });
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
            const verifyUrl = `${appUrl}/api/hospital/verify?token=${token}&email=${encodeURIComponent(String(email).toLowerCase())}`;
            await createNotification({
              userId: effectiveUserId,
              title: "Verify your hospital email",
              message: `Please verify your hospital email by clicking the button.`,
              actionUrl: verifyUrl,
              email: email,
              sendEmail: true,
              type: "info",
            });
          } catch (e) {
            console.error("Failed to send verification email:", e);
          }
        }
        return NextResponse.json(hospital);
      } else {
        // Generate a unique hospitalCode for new hospitals (e.g. HOSP-AB1234)
        const generateCode = () => {
          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
          let code = "HOSP-";
          for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
          return code;
        };
        // Ensure uniqueness
        let hospitalCode = generateCode();
        let attempts = 0;
        while (attempts < 10) {
          const existing = await db.query.hospitalProfiles.findFirst({
            where: eq(hospitalProfiles.hospitalCode, hospitalCode),
            columns: { id: true },
          });
          if (!existing) break;
          hospitalCode = generateCode();
          attempts++;
        }

        // Insert new profile
        const [hospital] = await db.insert(hospitalProfiles)
          .values({ userId: effectiveUserId, ...hospitalData, hospitalCode })
          .returning();

        try {
          const owner = await db.query.users.findFirst({ where: eq(users.id, effectiveUserId) });
          const email = owner?.email || data.email;
          const token = randomBytes(24).toString("hex");
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
          await db.insert(verificationTokens).values({ identifier: String(email).toLowerCase(), token, expires });
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
          const verifyUrl = `${appUrl}/api/hospital/verify?token=${token}&email=${encodeURIComponent(String(email).toLowerCase())}`;
          await createNotification({
            userId: effectiveUserId,
            title: "Verify your hospital email",
            message: `Please verify your hospital email by clicking the button.`,
            actionUrl: verifyUrl,
            email: email,
            sendEmail: true,
            type: "info",
          });
        } catch (e) {
          console.error("Failed to send verification email:", e);
        }

        return NextResponse.json(hospital);
      }
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Handle role update from onboarding
    if (body.updateRole) {
      const validRoles = ["donor", "recipient", "hospital"];
      if (!validRoles.includes(body.updateRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Don't change admin role
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });
      if (currentUser?.role === "admin") {
        return NextResponse.json({ message: "Admin role preserved" });
      }

      await db.update(users).set({ role: body.updateRole }).where(eq(users.id, session.user.id));
      return NextResponse.json({ message: `Role updated to ${body.updateRole}` });
    }

    // Handle availability toggle
    if (body.availability && body.role === "donor") {
      await db.update(donorProfiles).set({ availability: body.availability }).where(eq(donorProfiles.userId, session.user.id));
      return NextResponse.json({ message: "Availability updated" });
    }

    return NextResponse.json({ error: "No valid update fields" }, { status: 400 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
