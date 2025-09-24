"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Settings, CheckCircle, AlertCircle, 
  ArrowUpDown, Database, Server, Globe 
} from "lucide-react";
import toast from "react-hot-toast";
import { type Edition } from "@/lib/edition";
import { useEdition } from "@/hooks/use-edition";

export default function SuperAdminPanel() {
  const { data: session } = useSession();
  const { edition: currentEdition, isLoading, refreshEdition } = useEdition();
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user has superadmin role
  const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";

  const handleEditionChange = async (newEdition: Edition) => {
    if (currentEdition === newEdition) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/editions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ edition: newEdition }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Deployment updated to ${newEdition} edition successfully!`);
        
        // Refresh the edition cache and reload to apply changes
        await refreshEdition();
        
        // Small delay then reload to ensure changes are applied
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update deployment edition");
      }
    } catch (error) {
      toast.error("Failed to update deployment edition");
    } finally {
      setIsUpdating(false);
    }
  };

  const editionFeatures = {
    BASIC: [
      "Dashboard",
      "Patients Management",
      "Appointments",
      "Queue Management",
      "Prescriptions",
      "Basic Billing",
      "Basic Reports",
      "Admin Panel",
      "Settings",
      "User Management",
      "Doctor Availability"
    ],
    ADVANCED: [
      "All BASIC features",
      "IPD Management",
      "Lab Services",
      "Imaging Services",
      "OT/Procedures",
      "Pharmacy Management",
      "Pharmacy Queue",
      "Advanced Reports",
      "Roles & Permissions",
      "SSE (Real-time)"
    ],
    ENTERPRISE: [
      "All ADVANCED features",
      "Doctor QR",
      "Marketing Tools",
      "Multi-location Support",
      "Offline Capabilities",
      "Audit Logs",
      "Priority Support"
    ]
  };

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-center text-red-600">
              Access denied. Super Administrator privileges required.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-primary-600" />
          Super Admin Panel
        </h1>
        <p className="text-gray-600 mt-2">
          Manage deployment editions and system-wide configurations
        </p>
      </div>

      {/* Edition Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Deployment Edition Management
          </CardTitle>
          <CardDescription>
            Switch between different editions to enable or disable features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-sm text-blue-700">
                Current Edition: <span className="font-bold">{currentEdition}</span>
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-600 mt-1">
                    Debug: Loading={isLoading.toString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["BASIC", "ADVANCED", "ENTERPRISE"] as Edition[]).map((edition) => (
              <Card 
                key={edition} 
                className={`cursor-pointer transition-all ${
                  currentEdition === edition 
                    ? "border-2 border-blue-500 shadow-lg" 
                    : "hover:shadow-md"
                }`}
                onClick={() => handleEditionChange(edition)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {edition}
                    {currentEdition === edition && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {edition === "BASIC" && "Essential features for small clinics"}
                    {edition === "ADVANCED" && "Comprehensive features for hospitals"}
                    {edition === "ENTERPRISE" && "Advanced features for healthcare chains"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {editionFeatures[edition].map((feature, index) => (
                      <li key={index} className="text-sm flex items-start">
                        <ArrowUpDown className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full mt-4"
                    variant={currentEdition === edition ? "default" : "outline"}
                    disabled={isUpdating || currentEdition === edition}
                  >
                    {currentEdition === edition ? "Current Edition" : "Switch to " + edition}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Changing editions will update the system features immediately. 
                  Please ensure you have proper licensing agreements before upgrading.
                  Some features may require additional configuration after switching editions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Server Configuration</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Edition:</span> {currentEdition}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Environment:</span> Production
                </p>
                <div className="text-sm text-gray-600 flex items-center">
                  <span className="font-medium">Status:</span> 
                  <Badge className="ml-2 bg-green-100 text-green-800">Online</Badge>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Feature Status</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Active Features:</span> {editionFeatures[currentEdition].length}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Features:</span> 20
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Feature Gate:</span> Enabled
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
