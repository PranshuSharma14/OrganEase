import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, donorProfiles, recipientProfiles, hospitalProfiles, matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
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

    console.log('Deleting profile:', { userId, userRole });

    // Delete role-specific profile and associated matches
    if (userRole === "donor") {
      // Get donor profile ID first
      const donorProfile = await db.query.donorProfiles.findFirst({
        where: eq(donorProfiles.userId, userId),
        columns: { id: true },
      });
      
      if (donorProfile) {
        console.log('Deleting donor matches for profile:', donorProfile.id);
        // Delete matches where this donor was involved (cascade should handle this, but being explicit)
        await db.delete(matches).where(eq(matches.donorId, donorProfile.id));
      }
      
      // Delete donor profile (cascade will delete matches)
      await db.delete(donorProfiles).where(eq(donorProfiles.userId, userId));
      
    } else if (userRole === "recipient") {
      // Get recipient profile ID first
      const recipientProfile = await db.query.recipientProfiles.findFirst({
        where: eq(recipientProfiles.userId, userId),
        columns: { id: true },
      });
      
      if (recipientProfile) {
        console.log('Deleting recipient matches for profile:', recipientProfile.id);
        // Delete matches where this recipient was involved (cascade should handle this, but being explicit)
        await db.delete(matches).where(eq(matches.recipientId, recipientProfile.id));
      }
      
      // Delete recipient profile (cascade will delete matches)
      await db.delete(recipientProfiles).where(eq(recipientProfiles.userId, userId));
      
    } else if (userRole === "hospital") {
      // Delete hospital profile
      await db.delete(hospitalProfiles).where(eq(hospitalProfiles.userId, userId));
    }

    // Delete user account
    await db.delete(users).where(eq(users.id, userId));

    console.log('Profile deleted successfully:', userId);

    return NextResponse.json(
      { message: "Profile deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
