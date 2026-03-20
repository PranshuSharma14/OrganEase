import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

// Temporary route to promote a user to admin
// DELETE THIS FILE after use
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  try {
    if (email) {
      // Promote specific email
      const result = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email))
        .returning({ id: users.id, email: users.email, role: users.role });

      if (result.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Promoted to admin", user: result[0] });
    } else {
      // List all users
      const allUsers = await db
        .select({ id: users.id, email: users.email, role: users.role, name: users.name })
        .from(users)
        .orderBy(desc(users.createdAt));

      return NextResponse.json({ users: allUsers });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
