"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, List, Building2, Bed, Activity } from "lucide-react";

export default function SettingsHubPage() {
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
            <div className="p-5 border rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                <Building2 className="w-5 h-5" /> Hospital Settings
              </div>
              <p className="text-sm text-gray-600 mb-4">Configure hospital information, branding, business hours, sessions, and advanced options.</p>
              <Link href="/admin/settings/configure">
                <Button className="">Open Settings</Button>
              </Link>
            </div>
            <div className="p-5 border rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                <Activity className="w-5 h-5" /> OT & Imaging Services
              </div>
              <p className="text-sm text-gray-600 mb-4">Configure surgical and imaging services with procedures and pricing for billing.</p>
              <Link href="/admin/settings/services">
                <Button className="">Manage Services</Button>
              </Link>
            </div>
            <div className="p-5 border rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                <List className="w-5 h-5" /> Problem Categories
              </div>
              <p className="text-sm text-gray-600 mb-4">Manage configurable health concern categories for public booking.</p>
              <Link href="/admin/problem-categories">
                <Button className="">Open Categories</Button>
              </Link>
            </div>
            <div className="p-5 border rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                <List className="w-5 h-5" /> Departments
              </div>
              <p className="text-sm text-gray-600 mb-4">Manage hospital departments used across the system.</p>
              <Link href="/admin/departments">
                <Button className="">Open Departments</Button>
              </Link>
            </div>
            <div className="p-5 border rounded-lg bg-white">
              <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
                <Bed className="w-5 h-5" /> IPD Settings
              </div>
              <p className="text-sm text-gray-600 mb-4">Configure ward types, bed types, capacities, and IPD management settings.</p>
              <Link href="/admin/settings/ipd">
                <Button className="">Open IPD Settings</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
