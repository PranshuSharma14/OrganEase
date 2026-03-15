"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, ArrowRight, Shield, Users, Hospital, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [email, setEmail] = useState("");

  const handleEmailSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    try {
      // Check if user exists
      const checkResponse = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sanitizedEmail }),
      });
      
      const checkData = await checkResponse.json();
      
      if (!checkData.exists) {
        setError("No account found with this email. Please create a new account by selecting your role on the home page.");
        setIsLoading(false);
        return;
      }

      // Sign in with credentials (email only, no password required for onboarding accounts)
      const result = await signIn("credentials", {
        email: sanitizedEmail,
        password: "onboarding-account", // Special password for passwordless accounts
        redirect: false,
      });

      if (result?.error) {
        setError("Unable to sign in. Please try again or create a new account.");
      } else {
        // Redirect to the dashboard based on user's role
        const userRole = checkData.role || "donor";
        router.push(`/dashboard/${userRole}`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="flex items-center gap-3">
            <Heart className="h-16 w-16 text-blue-600 fill-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">OrganEase</h1>
              <p className="text-gray-600">Saving Lives, One Match at a Time</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Secure & Private</h3>
                <p className="text-sm text-gray-600">Your data is encrypted and protected</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Smart Matching</h3>
                <p className="text-sm text-gray-600">AI-powered donor-recipient matching</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hospital className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Hospital Verified</h3>
                <p className="text-sm text-gray-600">All profiles verified by medical institutions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-3 md:hidden">
              <Heart className="h-12 w-12 text-blue-600 fill-blue-600" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your email to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter the email you used during onboarding
                </p>
              </div>

              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">New to OrganEase?</span>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Select your role to get started:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <Link href="/onboarding/donor">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Heart className="h-4 w-4 mr-1" />
                    Donor
                  </Button>
                </Link>
                <Link href="/onboarding/recipient">
                  <Button size="sm" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                    <Users className="h-4 w-4 mr-1" />
                    Recipient
                  </Button>
                </Link>
                <Link href="/onboarding/hospital">
                  <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <Hospital className="h-4 w-4 mr-1" />
                    Hospital
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
