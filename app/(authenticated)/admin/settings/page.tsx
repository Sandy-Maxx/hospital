"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, List, Building2, Bed, Activity } from "lucide-react";
import { hasFeature } from "@/lib/edition";

export default function SettingsHubPage() {
  const settingsItems = [
    {
      title: "Hospital Settings",
      description: "Configure hospital information, branding, business hours, sessions, and advanced options.",
      icon: Building2,
      href: "/admin/settings/configure",
      feature: "settings",
    },
    {
      title: "OT & Imaging Services", 
      description: "Configure surgical and imaging services with procedures and pricing for billing.",
      icon: Activity,
      href: "/admin/settings/services",
      feature: "ot", // Requires OT feature for surgical services
    },
    {
      title: "Problem Categories",
      description: "Manage configurable health concern categories for public booking.",
      icon: List,
      href: "/admin/problem-categories", 
      feature: "appointments", // Basic feature for appointment categories
    },
    {
      title: "Departments",
      description: "Manage hospital departments used across the system.",
      icon: List,
      href: "/admin/departments",
      feature: "admin", // Basic admin feature
    },
    {
      title: "IPD Settings",
      description: "Configure ward types, bed types, capacities, and IPD management settings.",
      icon: Bed,
      href: "/admin/settings/ipd",
      feature: "ipd", // Requires IPD feature
    },
  ];

  // Filter settings based on current edition
  const availableSettings = settingsItems.filter(item => {
    try {
      return hasFeature(item.feature as any);
    } catch (error) {
      console.error('Error checking feature for setting:', item.feature, error);
      // Include basic settings on error
      const basicFeatures = ['settings', 'appointments', 'admin'];
      return basicFeatures.includes(item.feature);
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Settings className="w-6 h-6 mr-2" /> Hospital Settings Hub
          </CardTitle>
          <CardDescription>Select a configuration area to open.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSettings.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-5 border rounded-lg bg-white">
                  <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                    <Icon className="w-5 h-5" /> {item.title}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  <Link href={item.href}>
                    <Button className="">
                      {item.title.includes('Settings') ? 'Open Settings' : 
                       item.title.includes('Services') ? 'Manage Services' :
                       item.title.includes('Categories') ? 'Open Categories' :
                       item.title.includes('Departments') ? 'Open Departments' :
                       'Open IPD Settings'}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
