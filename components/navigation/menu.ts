"use client";

import React from "react";
import {
  Home, Calendar, Users, ClipboardList, Pill,
  CreditCard, BarChart2, Megaphone, FlaskConical, Bed, Scan, Shield, Settings, QrCode
} from "lucide-react";

export type RouteMeta = {
  label: string;
  icon: React.ComponentType<any>;
};

// Single source of truth for route labels and icons
export const routeMeta: Record<string, RouteMeta> = {
  "/dashboard": { label: "Dashboard", icon: Home },
  "/appointments": { label: "Appointments", icon: Calendar },
  "/patients": { label: "Patients", icon: Users },
  "/patients/new": { label: "Patient Registration", icon: Users },
  "/queue": { label: "Queue", icon: ClipboardList },
  "/prescriptions": { label: "Prescriptions", icon: Pill },
  "/billing": { label: "Billing", icon: CreditCard },
  "/reports": { label: "Reports", icon: BarChart2 },
  "/reports/ot-imaging": { label: "OT/Imaging Report", icon: BarChart2 },
  "/marketing": { label: "Marketing", icon: Megaphone },
  "/lab": { label: "Path Lab", icon: FlaskConical },
  "/imaging": { label: "Imaging", icon: Scan },
  "/ot": { label: "OT / Procedures", icon: ClipboardList },
  "/ipd": { label: "IPD Management", icon: Bed },
  "/admin": { label: "Admin Panel", icon: Shield },
  "/admin/users": { label: "User Management", icon: Users },
  "/admin/roles": { label: "Role Management", icon: Shield },
  "/admin/settings": { label: "Hospital Settings", icon: Settings },
  "/admin/doctor-availability": { label: "Doctor Availability", icon: Calendar },
  "/admin/doctor-qr": { label: "Doctor QR", icon: QrCode },
  "/admin/pharmacy": { label: "Pharmacy", icon: Pill },
  "/pharmacy-queue": { label: "Pharmacy Queue", icon: Pill },
  "/profile": { label: "My Profile", icon: Users },
  "/doctor": { label: "Doctor Console", icon: Users },
};

export type MobileMenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
};

export function getMobileMenuItems(role: string): MobileMenuItem[] {
  const commonHrefs = ["/dashboard", "/appointments"] as const;
  const toItems = (hrefs: string[]) => hrefs
    .filter((h) => routeMeta[h])
    .map((h) => ({ href: h, label: routeMeta[h].label, icon: routeMeta[h].icon }));

  if (role === "ADMIN") {
    return toItems([
      ...commonHrefs,
      "/patients",
      "/queue",
      "/billing",
      "/reports",
      "/marketing",
      "/lab",
      "/ipd",
      "/imaging",
      "/ot",
      "/admin/pharmacy",
      "/pharmacy-queue",
      "/admin/roles",
      "/admin/settings",
      "/admin/doctor-qr",
      "/profile",
    ]);
  }

  if (role === "DOCTOR") {
    return toItems([
      ...commonHrefs,
      "/queue",
      "/doctor",
      "/ipd",
      "/prescriptions",
      "/profile",
    ]);
  }

  if (role === "NURSE") {
    return toItems([
      ...commonHrefs,
      "/patients",
      "/queue",
      "/profile",
    ]);
  }

  if (role === "RECEPTIONIST") {
    return toItems([
      ...commonHrefs,
      "/patients/new",
      "/patients",
      "/billing",
      "/profile",
    ]);
  }

  return toItems([...commonHrefs]);
}
