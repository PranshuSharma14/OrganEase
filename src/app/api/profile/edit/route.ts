import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { donorProfiles, recipientProfiles, hospitalProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const body = await request.json();

    // Define which fields are editable per role
    if (userRole === "donor") {
      // Get user's current details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Validate emergency contact is not the same as user
      if (body.emergencyContactName || body.emergencyContactPhone) {
        const emergencyName = body.emergencyContactName?.trim().toLowerCase();
        const emergencyPhone = body.emergencyContactPhone?.replace(/\D/g, ''); // Remove non-digits
        const userName = user.name?.trim().toLowerCase();
        const userPhone = user.phone?.replace(/\D/g, '');

        if (emergencyName && userName && emergencyName === userName) {
          return NextResponse.json(
            { error: "Emergency contact name cannot be the same as your registered name" },
            { status: 400 }
          );
        }

        if (emergencyPhone && userPhone && emergencyPhone === userPhone) {
          return NextResponse.json(
            { error: "Emergency contact phone cannot be the same as your registered phone number" },
            { status: 400 }
          );
        }

        // Check if both name and phone match
        if (emergencyName && emergencyPhone && userName && userPhone && 
            emergencyName === userName && emergencyPhone === userPhone) {
          return NextResponse.json(
            { error: "Emergency contact cannot be the same person as the registered user" },
            { status: 400 }
          );
        }
      }

      const allowedFields = {
        phone: body.phone,
        city: body.city,
        state: body.state,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        availabilityStatus: body.availabilityStatus,
      };

      // Remove undefined values
      const updateData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
      );

      await db
        .update(donorProfiles)
        .set(updateData)
        .where(eq(donorProfiles.userId, userId));

      return NextResponse.json({ message: "Profile updated successfully" });
      
    } else if (userRole === "recipient") {
      // Get user's current details
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Validate emergency contact is not the same as user
      if (body.emergencyContactName || body.emergencyContactPhone) {
        const emergencyName = body.emergencyContactName?.trim().toLowerCase();
        const emergencyPhone = body.emergencyContactPhone?.replace(/\D/g, '');
        const userName = user.name?.trim().toLowerCase();
        const userPhone = user.phone?.replace(/\D/g, '');

        if (emergencyName && userName && emergencyName === userName) {
          return NextResponse.json(
            { error: "Emergency contact name cannot be the same as your registered name" },
            { status: 400 }
          );
        }

        if (emergencyPhone && userPhone && emergencyPhone === userPhone) {
          return NextResponse.json(
            { error: "Emergency contact phone cannot be the same as your registered phone number" },
            { status: 400 }
          );
        }

        if (emergencyName && emergencyPhone && userName && userPhone && 
            emergencyName === userName && emergencyPhone === userPhone) {
          return NextResponse.json(
            { error: "Emergency contact cannot be the same person as the registered user" },
            { status: 400 }
          );
        }
      }

      const allowedFields = {
        phone: body.phone,
        city: body.city,
        state: body.state,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        currentHospital: body.currentHospital,
        hospitalCity: body.hospitalCity,
        doctorName: body.doctorName,
        doctorPhone: body.doctorPhone,
      };

      const updateData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
      );

      await db
        .update(recipientProfiles)
        .set(updateData)
        .where(eq(recipientProfiles.userId, userId));

      return NextResponse.json({ message: "Profile updated successfully" });
      
    } else if (userRole === "hospital") {
      const allowedFields = {
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
      };

      const updateData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, v]) => v !== undefined)
      );

      await db
        .update(hospitalProfiles)
        .set(updateData)
        .where(eq(hospitalProfiles.userId, userId));

      return NextResponse.json({ message: "Profile updated successfully" });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
