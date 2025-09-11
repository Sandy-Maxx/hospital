"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, List, Building2 } from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
