import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "donor" | "recipient" | "hospital" | "admin";
  image?: string | null;
};

/**
 * Get the currently authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: (session.user as any).email || "",
    name: (session.user as any).name || "",
    role: (session.user as any).role || "donor",
    image: session.user.image,
  };
}

/**
 * Require authentication. Throws an object with status and error if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw { status: 401, error: "Authentication required" };
  }
  return user;
}

/**
 * Require a specific role. Throws an object with status and error if role doesn't match.
 */
export async function requireRole(...roles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw { status: 403, error: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${user.role}` };
  }
  return user;
}
