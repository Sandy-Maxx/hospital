"use client";

import {
  Home, Calendar, Users, ClipboardList, Pill,
  CreditCard, BarChart2, Megaphone, FlaskConical, Bed, Scan, Shield, Settings, QrCode
} from "lucide-react";

export type MobileMenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
};

export function getMobileMenuItems(role: string): MobileMenuItem[] {
  const common: MobileMenuItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/appointments", label: "Appointments", icon: Calendar },
  ];

  if (role === "ADMIN") {
    return [
      ...common,
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/queue", label: "Queue", icon: ClipboardList },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/reports", label: "Reports", icon: BarChart2 },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/lab", label: "Lab", icon: FlaskConical },
      { href: "/ipd", label: "IPD", icon: Bed },
      { href: "/imaging", label: "Imaging", icon: Scan },
      { href: "/ot", label: "OT", icon: ClipboardList },
      { href: "/admin/pharmacy", label: "Pharmacy", icon: Pill },
      { href: "/pharmacy-queue", label: "Pharm. Queue", icon: Pill },
      { href: "/admin/roles", label: "Roles", icon: Shield },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/doctor-qr", label: "Doctor QR", icon: QrCode },
      { href: "/profile", label: "Profile", icon: Users },
    ];
  }

  if (role === "DOCTOR") {
    return [
      ...common,
      { href: "/queue", label: "Queue", icon: ClipboardList },
      { href: "/doctor", label: "Console", icon: Users },
      { href: "/ipd", label: "IPD", icon: Bed },
      { href: "/prescriptions", label: "Rx", icon: Pill },
      { href: "/profile", label: "Profile", icon: Users },
    ];
  }

  if (role === "NURSE") {
    return [
      ...common,
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/queue", label: "Queue", icon: ClipboardList },
      { href: "/profile", label: "Profile", icon: Users },
    ];
  }

  if (role === "RECEPTIONIST") {
    return [
      ...common,
      { href: "/patients/new", label: "Register", icon: Users },
      { href: "/patients", label: "Patients", icon: Users },
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/profile", label: "Profile", icon: Users },
    ];
  }

  return common;
}