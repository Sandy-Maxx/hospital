"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Home,
  Users,
  CreditCard,
  BarChart2,
  Megaphone,
  FlaskConical,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

function itemsForRole(role: string): Item[] {
  const common: Item[] = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/appointments", label: "Appts", icon: Calendar },
  ];
  if (role === "ADMIN") {
    return [
      ...common,
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: BarChart2 },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/lab", label: "Lab", icon: FlaskConical },
    ];
  }
  if (role === "RECEPTIONIST") {
    return [
      ...common,
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/billing", label: "Billing", icon: CreditCard },
    ];
  }
  if (role === "DOCTOR") {
    return [
      ...common,
      { href: "/queue", label: "Queue", icon: Calendar },
      { href: "/doctor", label: "Console", icon: Users },
    ];
  }
  if (role === "NURSE") {
    return [...common, { href: "/patients", label: "Patients", icon: Users }];
  }
  return common;
}

export default function MobileNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  if (!role) return null;
  const items = itemsForRole(role);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="grid grid-cols-4 gap-1">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-1 text-xs ${active ? "text-primary-600" : "text-gray-700"}`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
