import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Dynamically import bcrypt to avoid errors if not installed
let bcrypt: any;
try {
  bcrypt = require("bcryptjs");
} catch (e) {
  console.warn("bcryptjs not installed");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body;

    // Collect all validation errors
    const errors: string[] = [];

    // Check if bcrypt is available
    if (!bcrypt) {
      return NextResponse.json(
        { error: "Password authentication not available. Please use Google sign in or install bcryptjs." },
        { status: 503 }
      );
    }

    // Validate required fields
    if (!name) errors.push("Name is required");
    if (!email) errors.push("Email is required");
    if (!phone) errors.push("Phone number is required");
    if (!password) errors.push("Password is required");

    // Validate name
    if (name && name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (name && name.length > 100) {
      errors.push("Name is too long (max 100 characters)");
    }

    // Sanitize name (remove extra spaces)
    const sanitizedName = name ? name.trim().replace(/\s+/g, ' ') : '';

    // Validate email format (RFC 5322 compliant)
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        errors.push("Invalid email format");
      }
      if (email.length > 254) {
        errors.push("Email is too long");
      }
    }

    // Sanitize email
    const sanitizedEmail = email ? email.trim().toLowerCase() : '';

    // Validate phone number (required)
    if (phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(phone)) {
        errors.push("Invalid phone number format");
      }
      if (phone.length < 10) {
        errors.push("Phone number must be at least 10 digits");
      }
    }

    // Validate password
    if (password) {
      if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }
      if (password.length > 128) {
        errors.push("Password is too long (max 128 characters)");
      }

      // Validate password complexity
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      if (!hasUpperCase) errors.push("Password must contain at least one uppercase letter");
      if (!hasLowerCase) errors.push("Password must contain at least one lowercase letter");
      if (!hasNumber) errors.push("Password must contain at least one number");

      // Check for common weak passwords
      const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password1', 'Password1'];
      if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        errors.push("Password is too common. Please choose a stronger password");
      }
    }

    // Validate role
    const validRoles = ['donor', 'recipient', 'hospital'];
    if (role && !validRoles.includes(role)) {
      errors.push("Invalid role selected");
    }

    // Return all errors if any
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join("; ") },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, sanitizedEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password with higher cost factor for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with sanitized data
    const [newUser] = await db
      .insert(users)
      .values({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: phone?.trim() || null,
        password: hashedPassword,
        role: role || "donor",
      })
      .returning();

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
