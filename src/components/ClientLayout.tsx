"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import dynamic from "next/dynamic";

// Load CustomCursor only on client side to avoid hydration issues
const CustomCursor = dynamic(() => import("@/components/CustomCursor"), {
  ssr: false,
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomCursor />
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </>
  );
}
