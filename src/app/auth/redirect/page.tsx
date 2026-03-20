"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "pranshusharmaindia@gmail.com";

export default function RedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user) {
      const email = session.user.email;

      // Admin email always goes to admin dashboard
      if (email === ADMIN_EMAIL) {
        router.push("/dashboard/admin");
        return;
      }

      // For all other users, fetch their actual role from the DB
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.role) {
            router.push(`/dashboard/${data.role}`);
          } else {
            // Fallback to session role
            const role = (session.user as any).role || "donor";
            router.push(`/dashboard/${role}`);
          }
        })
        .catch(() => {
          // Fallback to session role
          const role = (session.user as any).role || "donor";
          router.push(`/dashboard/${role}`);
        });
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
