"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
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
import { featureForPath, hasFeature } from "@/lib/edition";
import { routeMeta } from "@/components/navigation/menu";

interface SidebarProps {
  className?: string;
}

type MenuLink = { icon: LucideIcon; label: string; href: string };
type MenuSection = { type: "section"; title: string };

type MenuEntry = MenuLink | MenuSection;

function getMenuItems(role: string): MenuEntry[] {
  const from = (href: string): MenuLink | null => {
    const meta = routeMeta[href];
    if (!meta) return null;
    return { icon: meta.icon as unknown as LucideIcon, label: meta.label, href };
  };

  if (role === "ADMIN") {
    const out: MenuEntry[] = [];
    out.push({ type: "section", title: "Overview" });
    const overview = ["/dashboard"]; overview.forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Administration" });
    ["/admin", "/admin/settings", "/admin/users", "/admin/roles", "/admin/doctor-availability", "/admin/doctor-qr"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Clinical" });
    ["/patients", "/appointments"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Departments" });
    ["/ipd", "/lab", "/imaging", "/ot"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Pharmacy" });
    ["/admin/pharmacy", "/pharmacy-queue"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Finance & Analytics" });
    ["/billing", "/reports", "/reports/ot-imaging"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Marketing" });
    ["/marketing"].forEach(h => { const x = from(h); if (x) out.push(x); });

    out.push({ type: "section", title: "Account" });
    ["/profile"].forEach(h => { const x = from(h); if (x) out.push(x); });

    return out;
  }

  if (role === "DOCTOR") {
    const hrefs = [
      "/dashboard",
      "/doctor",
      "/admin/doctor-availability",
      "/patients",
      "/prescriptions",
      "/queue",
      "/appointments",
      "/ipd",
      "/profile",
    ];
    return hrefs.map(from).filter(Boolean) as MenuLink[];
  }

  if (role === "RECEPTIONIST") {
    const hrefs = [
      "/dashboard",
      "/patients/new",
      "/appointments",
      "/admin/doctor-availability",
      "/queue",
      "/billing",
      "/patients",
      "/profile",
    ];
    return hrefs.map(from).filter(Boolean) as MenuLink[];
  }

  if (role === "NURSE") {
    const hrefs = [
      "/dashboard",
      "/queue",
      "/patients",
      "/appointments",
      "/profile",
    ];
    return hrefs.map(from).filter(Boolean) as MenuLink[];
  }

  return [];
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const [settings, setSettings] = useState<{
    name?: string;
    logo?: string;
  } | null>(null);
  const [editionRefresh, setEditionRefresh] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (res) => {
        if (res.ok) setSettings(await res.json());
      })
      .catch(() => {});
  }, []);

  // Listen for edition changes and force re-render
  useEffect(() => {
    const handleEditionChange = () => {
      setEditionRefresh(prev => prev + 1);
    };

    window.addEventListener('edition-changed', handleEditionChange);
    window.addEventListener('edition-updated', handleEditionChange);

    return () => {
      window.removeEventListener('edition-changed', handleEditionChange);
      window.removeEventListener('edition-updated', handleEditionChange);
    };
  }, []);

  if (!session?.user) return null;

  const userMenuItems: MenuEntry[] = useMemo(() => getMenuItems(session.user.role), [session.user.role]);

  // Build a processed list that removes empty sections after applying feature gating
  const processedMenuItems: MenuEntry[] = useMemo(() => {
    const out: MenuEntry[] = [];
    let i = 0;
    while (i < userMenuItems.length) {
      const item = userMenuItems[i] as MenuEntry;
      if ((item as MenuSection).type === "section") {
        const section = item as MenuSection;
        const visibleLinks: MenuLink[] = [];
        let j = i + 1;
        while (j < userMenuItems.length && (userMenuItems[j] as any).type !== "section") {
          const link = userMenuItems[j] as MenuLink;
          try {
            const feature = featureForPath(link.href);
            if (!feature || hasFeature(feature)) {
              visibleLinks.push(link);
            }
          } catch (error) {
            console.error('Error checking feature for link:', link.href, error);
            // Only include core links on error to avoid breaking basic functionality
            const coreLinks = ['/dashboard', '/admin', '/patients', '/appointments', '/profile'];
            if (coreLinks.includes(link.href)) {
              visibleLinks.push(link);
            }
          }
          j++;
        }
        if (visibleLinks.length > 0) {
          out.push(section, ...visibleLinks);
        }
        i = j;
      } else {
        const link = item as MenuLink;
        try {
          const feature = featureForPath(link.href);
          if (!feature || hasFeature(feature)) {
            out.push(link);
          }
        } catch (error) {
          console.error('Error checking feature for link:', link.href, error);
          // Only include core links on error to avoid breaking basic functionality
          const coreLinks = ['/dashboard', '/admin', '/patients', '/appointments', '/profile'];
          if (coreLinks.includes(link.href)) {
            out.push(link);
          }
        }
        i++;
      }
    }
    return out;
  }, [userMenuItems, editionRefresh]);

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
        {processedMenuItems.map((item, idx) => {
          // Section header (rendered only if it has visible links below)
          if ((item as MenuSection).type === "section") {
            const section = item as MenuSection;
            return (
              <div key={`section-${section.title}-${idx}`} className={cn("px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500", isCollapsed && "hidden")}>{section.title}</div>
            );
          }

          // Regular link
          const link = item as MenuLink;
          const Icon = link.icon;
          const isActive = pathname === link.href;
          const color = colorByHref[link.href] || "text-gray-500";
          const iconClasses = cn(
            "shrink-0",
            isCollapsed ? "w-7 h-7" : "w-6 h-6",
            isActive ? "text-primary-600" : color,
          );
          return (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.label : undefined}
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
              {!isCollapsed && <span>{link.label}</span>}
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
