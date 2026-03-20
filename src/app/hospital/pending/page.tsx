"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Clock, Shield, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function HospitalPendingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  // Poll every 5 seconds to check if hospital has been approved
  useEffect(() => {
    const checkApproval = async () => {
      try {
        setChecking(true);
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.verificationStatus === "verified") {
            toast.success("🎉 Your hospital has been approved! Redirecting to dashboard...");
            setTimeout(() => {
              router.push("/dashboard/hospital");
            }, 1500);
            return true; // Stop polling
          }
        }
      } catch {
        // Silently ignore errors
      } finally {
        setChecking(false);
      }
      return false;
    };

    // Check immediately on mount
    checkApproval();

    // Then poll every 5 seconds
    const interval = setInterval(async () => {
      const approved = await checkApproval();
      if (approved) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="h-8 w-8 text-blue-600 fill-blue-600" />
          <span className="text-2xl font-bold text-gray-900">OrganEase</span>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-0">
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Awaiting Admin Approval
          </h1>

          <p className="text-gray-500 mb-8 leading-relaxed">
            Your hospital profile has been submitted successfully. Our admin team will review your documents and verify your credentials. This page will automatically redirect once approved.
          </p>

          {/* Status Steps */}
          <div className="text-left space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800">Profile submitted</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              {checking ? (
                <Loader2 className="h-5 w-5 text-amber-500 flex-shrink-0 animate-spin" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-amber-800">
                Admin review in progress
                <span className="text-xs text-amber-500 ml-2">(checking...)</span>
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Shield className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-500">Dashboard access granted after approval</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Signed in as {session?.user?.email || "loading..."}
          </p>
        </div>

        <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 mt-6 inline-block transition-colors">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
