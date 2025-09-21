"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import MobileNavigation from "@/components/navigation/mobile-navigation";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!session) redirect("/auth/signin");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">{children}</main>
        <div className="md:hidden">
          <MobileNavigation />
        </div>
      </div>
    </div>
  );
}
