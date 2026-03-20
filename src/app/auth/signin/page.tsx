"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Shield, Building2, Users, Loader2, CheckCircle2 } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider);
    try {
      // Sign out existing session first to avoid session conflicts
      if (session) {
        await signOut({ redirect: false });
      }
      await signIn(provider, { callbackUrl: "/auth/redirect" });
    } catch {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-white">OrganEase</span>
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Welcome Back
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Sign in to access your dashboard and manage your organ donation journey securely.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, text: "Secure authentication" },
              { icon: Building2, text: "Hospital-controlled access" },
              { icon: Users, text: "Role-based dashboards" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/90 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-200 text-xs">
          © 2025 OrganEase. Ethical organ donation.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">OrganEase</span>
            </Link>
          </div>

          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-500">
                Use your Google account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-5">
              {/* Google Sign In - Primary */}
              <Button
                onClick={() => handleSignIn("google")}
                disabled={!!isLoading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm rounded-xl font-medium text-sm"
                variant="outline"
              >
                {isLoading === "google" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* GitHub Sign In - Secondary */}
              <Button
                onClick={() => handleSignIn("github")}
                disabled={!!isLoading}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm"
              >
                {isLoading === "github" ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                )}
                Continue with GitHub
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">New here?</span>
                </div>
              </div>

              {/* Role Buttons */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">Choose your role to get started:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Link href="/auth/signup?role=donor">
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 h-10">
                      <Heart className="h-3.5 w-3.5 mr-1" />
                      Donor
                    </Button>
                  </Link>
                  <Link href="/auth/signup?role=recipient">
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-green-200 text-green-600 hover:bg-green-50 h-10">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Recipient
                    </Button>
                  </Link>
                  <Link href="/auth/signup?role=hospital">
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-10">
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      Hospital
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <p className="text-[11px] text-gray-400 text-center pt-2">
                By signing in, you agree to our{" "}
                <a href="#" className="text-blue-500 hover:underline">Terms</a> and{" "}
                <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
