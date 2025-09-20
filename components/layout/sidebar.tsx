"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  UserPlus,
  ClipboardList,
  Stethoscope,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Activity,
  Pill,
  Shield,
  Clock,
  BarChart2,
  Megaphone,
  FlaskConical,
  Tags,
  QrCode,
  Bed,
  Scan,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const menuItems = {
  ADMIN: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Shield, label: "Admin Panel", href: "/admin" },
    { icon: Users, label: "User Management", href: "/admin/users" },
    {
      icon: Clock,
      label: "Doctor Availability",
      href: "/admin/doctor-availability",
    },
    { icon: Settings, label: "Hospital Settings", href: "/admin/settings" },
    { icon: QrCode, label: "Doctor QR", href: "/admin/doctor-qr" },
    { icon: UserPlus, label: "Patients", href: "/patients" },
    { icon: Calendar, label: "Appointments", href: "/appointments" },
    { icon: Pill, label: "Pharmacy", href: "/admin/pharmacy" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: BarChart2, label: "Reports", href: "/reports" },
    { icon: BarChart2, label: "OT/Imaging Report", href: "/reports/ot-imaging" },
    { icon: Pill, label: "Pharmacy Queue", href: "/pharmacy-queue" },
    { icon: Megaphone, label: "Marketing", href: "/marketing" },
    { icon: FlaskConical, label: "Path Lab", href: "/lab" },
    { icon: Bed, label: "IPD Management", href: "/ipd" },
    { icon: Scan, label: "Imaging", href: "/imaging" },
    { icon: ClipboardList, label: "OT / Procedures", href: "/ot" },
    { icon: Shield, label: "Role Management", href: "/admin/roles" },
    { icon: Users, label: "My Profile", href: "/profile" },
  ],
  DOCTOR: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Stethoscope, label: "Doctor Console", href: "/doctor" },
    {
      icon: Clock,
      label: "My Availability",
      href: "/admin/doctor-availability",
    },
    { icon: UserPlus, label: "Patients", href: "/patients" },
    { icon: FileText, label: "Prescriptions", href: "/prescriptions" },
    { icon: ClipboardList, label: "Queue Management", href: "/queue" },
    { icon: Calendar, label: "Appointments", href: "/appointments" },
    { icon: Bed, label: "IPD Management", href: "/ipd" },
    { icon: Users, label: "My Profile", href: "/profile" },
  ],
  RECEPTIONIST: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: UserPlus, label: "Patient Registration", href: "/patients/new" },
    { icon: Calendar, label: "Appointments", href: "/appointments" },
    {
      icon: Clock,
      label: "Doctor Schedules",
      href: "/admin/doctor-availability",
    },
    { icon: ClipboardList, label: "Queue Management", href: "/queue" },
    { icon: CreditCard, label: "Billing", href: "/billing" },
    { icon: Users, label: "Patients", href: "/patients" },
    { icon: Users, label: "My Profile", href: "/profile" },
  ],
  NURSE: [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: ClipboardList, label: "Queue", href: "/queue" },
    { icon: Users, label: "Patients", href: "/patients" },
    { icon: Calendar, label: "Appointments", href: "/appointments" },
    { icon: Users, label: "My Profile", href: "/profile" },
  ],
};

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [settings, setSettings] = useState<{
    name?: string;
    logo?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (res) => {
        if (res.ok) setSettings(await res.json());
      })
      .catch(() => {});
  }, []);

  if (!session?.user) return null;

  const userMenuItems =
    menuItems[session.user.role as keyof typeof menuItems] || [];

  // Colorful icon palette per route for a modern look
  const colorByHref: Record<string, string> = {
    "/dashboard": "text-sky-600",
    "/admin": "text-indigo-600",
    "/admin/users": "text-purple-600",
    "/admin/doctor-availability": "text-amber-600",
    "/admin/problem-categories": "text-teal-600",
    "/admin/settings": "text-gray-700",
    "/patients": "text-emerald-600",
    "/appointments": "text-cyan-600",
    "/admin/pharmacy": "text-green-600",
    "/billing": "text-rose-600",
    "/reports": "text-violet-600",
    "/reports/ot-imaging": "text-violet-700",
    "/pharmacy-queue": "text-green-700",
    "/marketing": "text-fuchsia-600",
    "/lab": "text-orange-600",
    "/profile": "text-slate-600",
    "/doctor": "text-emerald-700",
    "/queue": "text-amber-700",
    "/prescriptions": "text-pink-600",
    "/ipd": "text-blue-600",
    "/admin/roles": "text-purple-600",
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            {settings?.logo ? (
              <img
                src={settings.logo}
                alt="logo"
                className="w-8 h-8 object-contain rounded"
              />
            ) : (
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="font-semibold text-gray-900">
              {settings?.name || "Hospital"}
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          {isCollapsed ? (
            <Menu className="w-6 h-6" />
          ) : (
            <X className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {session.user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {(session.user as any).role?.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {userMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const color = colorByHref[item.href] || "text-gray-500";
          const iconClasses = cn(
            "shrink-0",
            isCollapsed ? "w-7 h-7" : "w-6 h-6",
            isActive ? "text-primary-600" : color,
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "min-h-[40px]",
                isActive
                  ? "bg-primary-50 text-primary-700 border-r-2 border-primary-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <div className="flex items-center justify-center w-8 h-8">
                <Icon className={iconClasses} />
              </div>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
