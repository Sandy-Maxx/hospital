"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Settings, FileText, Activity, UserPlus, Pill, Bed, Scan, FlaskConical, ClipboardList } from "lucide-react";
import Link from "next/link";
import { hasFeature } from "@/lib/edition";

export default function AdminDashboard() {
  const { data: session } = useSession();

  const [activePatients, setActivePatients] = useState<number>(0);
  const [totalStaff, setTotalStaff] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active patients
        const todayStr = new Date().toISOString().split("T")[0];
        const params = new URLSearchParams({
          date: todayStr,
          status: "ARRIVED,WAITING,IN_CONSULTATION,SCHEDULED",
          limit: "10000",
        });
        const appointmentsRes = await fetch(`/api/appointments?${params.toString()}`);
        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          const unique = new Set(
            (data.appointments || []).map((a: any) => a.patientId),
          );
          setActivePatients(unique.size);
        }

        // Fetch total staff count
        const staffRes = await fetch('/api/users');
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setTotalStaff(staffData.length || 0);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Staff",
      value: String(totalStaff),
      change: "Active users",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/users",
    },
    {
      title: "Active Patients",
      value: String(activePatients),
      change: "Currently active today",
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "System Health",
      value: "Online",
      change: "All systems operational",
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const allQuickActions = [
    {
      title: "Hospital Settings",
      description: "Configure hospital information and branding",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-blue-500 hover:bg-blue-600",
      feature: "settings",
    },
    {
      title: "Staff Management",
      description: "Manage staff members and permissions",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-500 hover:bg-green-600",
      feature: "users",
    },
    {
      title: "Reports & Analytics",
      description: "View detailed reports and analytics",
      icon: FileText,
      href: "/reports",
      color: "bg-purple-500 hover:bg-purple-600",
      feature: "reports.basic",
    },
    {
      title: "Patient Management",
      description: "Manage patient records and information",
      icon: UserPlus,
      href: "/patients",
      color: "bg-orange-500 hover:bg-orange-600",
      feature: "patients",
    },
    {
      title: "Pharmacy Management",
      description: "Manage medicine database, inventory, and GST",
      icon: Pill,
      href: "/admin/pharmacy",
      color: "bg-green-500 hover:bg-green-600",
      feature: "pharmacy",
    },
    {
      title: "IPD Management",
      description: "Manage in-patient department and bed allocation",
      icon: Bed,
      href: "/ipd",
      color: "bg-red-500 hover:bg-red-600",
      feature: "ipd",
    },
    {
      title: "Lab Management",
      description: "Manage pathology lab tests and results",
      icon: FlaskConical,
      href: "/lab",
      color: "bg-yellow-500 hover:bg-yellow-600",
      feature: "lab",
    },
    {
      title: "Imaging Services",
      description: "Manage radiology and imaging services",
      icon: Scan,
      href: "/imaging",
      color: "bg-indigo-500 hover:bg-indigo-600",
      feature: "imaging",
    },
    {
      title: "OT Management",
      description: "Manage operation theater and procedures",
      icon: ClipboardList,
      href: "/ot",
      color: "bg-pink-500 hover:bg-pink-600",
      feature: "ot",
    },
  ];

  // Filter actions based on current edition
  const quickActions = allQuickActions.filter(action => {
    try {
      return hasFeature(action.feature as any);
    } catch (error) {
      console.error('Error checking feature for admin action:', action.feature, error);
      // Include basic features on error
      const basicFeatures = ['settings', 'users', 'reports.basic', 'patients'];
      return basicFeatures.includes(action.feature);
    }
  });

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Admin privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const CardInner = (
            <Card
              className={
                stat.href
                  ? "hover:shadow-lg transition-shadow cursor-pointer"
                  : ""
              }
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={index} href={stat.href}>
              {CardInner}
            </Link>
          ) : (
            <div key={index}>{CardInner}</div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`p-3 rounded-lg text-white mb-4 ${action.color}`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New staff member added
                </p>
                <p className="text-xs text-gray-500">
                  Dr. Sarah Johnson joined Cardiology department
                </p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  System backup completed
                </p>
                <p className="text-xs text-gray-500">
                  Daily backup process finished successfully
                </p>
              </div>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Hospital settings updated
                </p>
                <p className="text-xs text-gray-500">
                  Branding and contact information modified
                </p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
