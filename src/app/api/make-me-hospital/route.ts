import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update user role to hospital
    await db.update(users)
      .set({ role: "hospital" })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ 
      success: true, 
      message: "Role updated to hospital. Please refresh the page.",
      userId: session.user.id 
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
