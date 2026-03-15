import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/signin",
    "/auth/signup",
    "/auth/error",
    "/auth/redirect",
    "/api/auth",
    "/onboarding",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) => 
    pathname.startsWith(route)
  );

  // Allow public routes and API routes
  // Allow public routes, onboarding pages, and API routes. Also allow onboarding POSTs to /api/profile
  if (
    isPublicRoute ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/api/auth") ||
    (pathname === "/api/profile" && req.method === "POST") ||
    pathname.startsWith("/api/upload")
  ) {
    return NextResponse.next();
  }

  // Redirect to signin if not logged in and trying to access protected route
  if (!isLoggedIn && pathname !== "/") {
    const signInUrl = new URL("/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
