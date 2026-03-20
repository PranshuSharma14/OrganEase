"use client";

import { useSession } from "next-auth/react";
import { Heart, Clock, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function HospitalPendingPage() {
  const { data: session } = useSession();

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
            Your hospital profile has been submitted successfully. Our admin team will review your documents and verify your credentials. This typically takes 2-5 business days.
          </p>

          {/* Status Steps */}
          <div className="text-left space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800">Profile submitted</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
              <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-800">Admin review in progress</span>
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
