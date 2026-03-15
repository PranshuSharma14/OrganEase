import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = session.user.role;

    if (role === "recipient") {
      // Find compatible donors for this recipient
      const recipient = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.userId, userId || session.user.id),
        columns: {
          id: true,
          userId: true,
          patientName: true,
          age: true,
          bloodGroup: true,
          requiredOrgan: true,
          city: true,
          state: true,
          priority: true,
          requestStatus: true,
        },
      });

      if (!recipient) {
        return NextResponse.json({ matches: [] });
      }

      // Find donors with matching blood group and organ availability
      const compatibleDonors = await db.select({
        id: donorProfiles.id,
        fullName: donorProfiles.fullName,
        age: donorProfiles.age,
        bloodGroup: donorProfiles.bloodGroup,
        city: donorProfiles.city,
        state: donorProfiles.state,
        organs: donorProfiles.organs,
        availability: donorProfiles.availability,
        documentsVerified: donorProfiles.documentsVerified,
        email: users.email,
      })
      .from(donorProfiles)
      .leftJoin(users, eq(donorProfiles.userId, users.id))
      .where(and(
        eq(donorProfiles.bloodGroup, recipient.bloodGroup),
        eq(donorProfiles.documentsVerified, true),
        eq(donorProfiles.availability, "active")
      ));

      // Filter by organ type
      const matches = compatibleDonors.filter(donor => {
        const organs = donor.organs as any;
        return Array.isArray(organs) && organs.includes(recipient.requiredOrgan);
      });

      return NextResponse.json({ matches });
    }

    if (role === "donor") {
      // Find compatible recipients for this donor
      const donor = await db.query.donorProfiles.findFirst({
        where: eq(donorProfiles.userId, userId || session.user.id),
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
        },
      });

      if (!donor) {
        return NextResponse.json({ matches: [] });
      }

      const organs = donor.organs as any;
      if (!Array.isArray(organs) || organs.length === 0) {
        return NextResponse.json({ matches: [] });
      }

      // Find recipients needing these organs with matching blood group
      const compatibleRecipients = await db.select({
        id: recipientProfiles.id,
        patientName: recipientProfiles.patientName,
        age: recipientProfiles.age,
        bloodGroup: recipientProfiles.bloodGroup,
        requiredOrgan: recipientProfiles.requiredOrgan,
        city: recipientProfiles.city,
        state: recipientProfiles.state,
        priority: recipientProfiles.priority,
        requestStatus: recipientProfiles.requestStatus,
        documentsVerified: recipientProfiles.documentsVerified,
        email: users.email,
      })
      .from(recipientProfiles)
      .leftJoin(users, eq(recipientProfiles.userId, users.id))
      .where(and(
        eq(recipientProfiles.bloodGroup, donor.bloodGroup),
        eq(recipientProfiles.documentsVerified, true),
        eq(recipientProfiles.requestStatus, "verified")
      ));

      const matches = compatibleRecipients.filter(recipient => 
        organs.includes(recipient.requiredOrgan)
      );

      return NextResponse.json({ matches });
    }

    return NextResponse.json({ matches: [] });
  } catch (error) {
    console.error("Error finding matches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
