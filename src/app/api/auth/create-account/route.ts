import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, role } = await request.json();

    // Validate required fields
    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    if (existingUser) {
      // User already exists, return their ID
      return NextResponse.json({
        userId: existingUser.id,
        email: existingUser.email,
        message: "User already exists"
      });
    }

    // Create new user
    const [newUser] = await db.insert(users).values({
      email: sanitizedEmail,
      name: name,
      phone: phone || null,
      role: role,
      password: null, // No password - direct onboarding
    }).returning();

    return NextResponse.json({
      userId: newUser.id,
      email: newUser.email,
      message: "User created successfully"
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
