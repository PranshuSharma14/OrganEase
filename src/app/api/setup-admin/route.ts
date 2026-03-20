import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Temporary route to manage user roles — DELETE AFTER USE
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const role = url.searchParams.get("role") || "admin";

  if (!email) {
    // List all users with their roles
    const allUsers = await db
      .select({ id: users.id, email: users.email, role: users.role, name: users.name })
      .from(users);
    return NextResponse.json({ users: allUsers });
  }

  const validRoles = ["donor", "recipient", "hospital", "admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role. Use: donor, recipient, hospital, admin" }, { status: 400 });
  }

  try {
    const result = await db
      .update(users)
      .set({ role: role as any })
      .where(eq(users.email, email))
      .returning({ id: users.id, email: users.email, role: users.role, name: users.name });

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `✅ Role set to '${role}'`, 
      user: result[0],
      next: "Sign out and sign back in to refresh your session"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
