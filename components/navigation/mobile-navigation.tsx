"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Home, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import BottomSheet from "@/components/ui/bottom-sheet";
import { getMobileMenuItems } from "./menu";

export default function MobileNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  if (!role) return null;

  const allItems = useMemo(() => getMobileMenuItems(role), [role]);

  const primary = useMemo(() => {
    const defaults = [
      allItems.find((i) => i.href === "/dashboard") || { href: "/dashboard", label: "Home", icon: Home },
      allItems.find((i) => i.href === "/appointments") || { href: "/appointments", label: "Appts", icon: Calendar },
      allItems.find((i) => i.href === "/queue"),
      allItems.find((i) => i.href === "/patients"),
    ].filter(Boolean) as typeof allItems;
    const seen = new Set<string>();
    const unique: typeof allItems = [];
    for (const it of defaults) {
      if (!seen.has(it.href)) {
        unique.push(it);
        seen.add(it.href);
      }
      if (unique.length >= 3) break;
    }
    return unique;
  }, [allItems]);

  const [appsOpen, setAppsOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-between">
          {primary.map((item) => {
            const Icon = item.icon as any;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] min-h-[52px] ${active ? "text-primary-600" : "text-gray-700"}`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            aria-label="Open app launcher"
            onClick={() => setAppsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 text-[11px] min-h-[52px] text-gray-700"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="font-medium">Apps</span>
          </button>
        </div>
      </nav>

      <BottomSheet isOpen={appsOpen} onClose={() => setAppsOpen(false)} title="All Apps">
        <div className="grid grid-cols-4 gap-3">
          {allItems.map((item) => {
            const Icon = item.icon as any;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAppsOpen(false)}
                className={`flex flex-col items-center justify-center rounded-lg px-2 py-3 ${active ? "bg-primary-50 text-primary-700" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}
              >
                <Icon className={`w-6 h-6 mb-1 ${active ? "text-primary-600" : "text-gray-600"}`} />
                <span className="text-[11px] font-medium text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}
