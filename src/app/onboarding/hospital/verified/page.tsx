"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Verified() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20">
      <div className="max-w-xl w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Hospital Verified</h2>
        <p className="text-gray-600 mb-6">Thank you — your hospital email has been verified. Your hospital profile is now marked as verified and will have access according to platform policies.</p>
        <div className="flex gap-4">
          <Link href="/dashboard/hospital">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
