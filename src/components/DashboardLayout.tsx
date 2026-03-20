"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
};

type DashboardLayoutProps = {
  children: ReactNode;
  role: "donor" | "recipient" | "hospital" | "admin";
  userName?: string;
  userEmail?: string;
  navItems: NavItem[];
};

const roleColors: Record<string, { accent: string; bg: string; text: string }> = {
  donor: { accent: "bg-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
  recipient: { accent: "bg-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
  hospital: { accent: "bg-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
  admin: { accent: "bg-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600" },
};

const roleLabels: Record<string, string> = {
  donor: "Donor Dashboard",
  recipient: "Recipient Dashboard",
  hospital: "Hospital Dashboard",
  admin: "Admin Dashboard",
};

export default function DashboardLayout({
  children,
  role,
  userName,
  userEmail,
  navItems,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const colors = roleColors[role] || roleColors.donor;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4 shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors mr-3"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
        </button>

        <div className="flex items-center gap-2">
          <Heart className="h-7 w-7 text-blue-600 fill-blue-600" />
          <span className="text-lg font-bold text-gray-900">OrganEase</span>
          <span className="text-sm text-gray-400 ml-1">|</span>
          <span className="text-sm font-medium text-gray-600 ml-1">{roleLabels[role]}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName || "User"}</p>
            <p className="text-xs text-gray-500">{userEmail || ""}</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarFallback className={`${colors.bg} ${colors.text} text-sm font-semibold`}>
              {userName?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 transition-all duration-200 z-40 ${
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        }`}
      >
        <nav className="flex flex-col h-full pt-4 pb-4">
          <div className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? `${colors.bg} ${colors.text}`
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="px-3 border-t border-gray-100 pt-3">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-200 ${
          sidebarOpen ? "ml-60" : "ml-0"
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
