import type React from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileButton } from "@/components/profile-button";
import { SwitchCompanyButton } from "@/components/switch-company";
import "leaflet/dist/leaflet.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-[65px] border-b border-gray-100 bg-white px-6 flex items-center justify-end shadow-sm z-10 transition-all duration-300">
          <div className="flex items-center space-x-3 pr-2">
            {/* <ThemeToggle /> */}
            <SwitchCompanyButton />
            <div className="h-6 w-px bg-blue-100/60 mx-1" />
            <SignOutButton />
            <div className="h-6 w-px bg-blue-100/60 mx-1" />
            <ProfileButton />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-6 bg-[#f8fafc]">{children}</main>
      </div>
    </div>
  );
}