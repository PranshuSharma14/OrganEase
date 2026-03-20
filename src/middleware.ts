import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/signin",
    "/auth/signup",
    "/auth/error",
    "/auth/redirect",
    "/api/auth",
    "/onboarding",
    "/api/setup-admin",
    "/hospital/pending",
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes and NextAuth API routes
  if (isPublicRoute || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Landing page is always accessible
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Redirect to signin if not logged in
  if (!isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based route protection for dashboards
  // Only block admin dashboard for non-admin users
  if (pathname.startsWith("/dashboard/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/auth/redirect", req.url));
  }

  // API route protection - all API routes require authentication (except auth routes above)
  if (pathname.startsWith("/api/")) {
    // Hospital-only API routes (but allow send-otp for onboarding)
    const hospitalOnlyRoutes = [
      "/api/hospital/",
      "/api/find-matches",
      "/api/matches/create-all",
      "/api/ai/risk-check",
      "/api/ai/explain-match",
    ];

    // These hospital APIs can be called during onboarding
    const hospitalOnboardingBypass = [
      "/api/hospital/send-otp",
      "/api/hospital/verify-otp",
      "/api/hospital/verifications",
    ];

    if (hospitalOnlyRoutes.some(r => pathname.startsWith(r))) {
      if (!hospitalOnboardingBypass.some(r => pathname.startsWith(r))) {
        if (userRole !== "hospital" && userRole !== "admin") {
          return NextResponse.json({ error: "Hospital access required" }, { status: 403 });
        }
      }
    }

    // Admin-only API routes
    const adminOnlyRoutes = [
      "/api/admin/",
    ];

    if (adminOnlyRoutes.some(r => pathname.startsWith(r))) {
      if (userRole !== "admin") {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
