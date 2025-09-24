"use client";

import React, { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, User, LogOut, UserCheck } from "lucide-react";

export default function DevHelper() {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any)?.role;

  const testUsers = [
    {
      name: "SuperAdmin",
      email: "superadmin@hospital.com",
      password: "superadmin123",
      role: "SUPERADMIN",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      name: "Admin",
      email: "admin@hospital.com", 
      password: "admin123",
      role: "ADMIN",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      name: "Doctor",
      email: "doctor@hospital.com",
      password: "doctor123", 
      role: "DOCTOR",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      name: "Receptionist",
      email: "reception@hospital.com",
      password: "reception123",
      role: "RECEPTIONIST", 
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const quickActions = [
    {
      label: "SuperAdmin Panel",
      href: "/superadmin",
      role: "SUPERADMIN",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      label: "Admin Panel",
      href: "/admin",
      role: "ADMIN",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "User Management",
      href: "/admin/users",
      role: "ADMIN",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "Doctor Console",
      href: "/doctor",
      role: "DOCTOR",
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  const availableActions = quickActions.filter(
    action => !action.role || userRole === action.role || userRole === "SUPERADMIN"
  );

  const handleRoleSwitch = async (user: typeof testUsers[0]) => {
    try {
      // Clear any cached edition data before switching
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      await signOut({ redirect: false });
      
      // Longer delay to ensure complete signout and cache clearing
      setTimeout(async () => {
        try {
          const result = await signIn("credentials", {
            email: user.email,
            password: user.password,
            redirect: false
          });
          
          if (result?.ok) {
            // Successful login, redirect based on role
            const redirectUrl = user.role === "SUPERADMIN" ? "/superadmin" : "/dashboard";
            window.location.href = redirectUrl;
          } else {
            console.error("Login failed:", result?.error);
          }
        } catch (loginError) {
          console.error("Login error:", loginError);
        }
      }, 1000);
    } catch (error) {
      console.error("Role switch failed:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
        >
          <Settings className="w-5 h-5" />
        </Button>
      ) : (
        <Card className="w-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center">
                <User className="w-4 h-4 mr-2" />
                Dev Helper
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-gray-600">
              <p><strong>User:</strong> {session.user?.name}</p>
              <p><strong>Email:</strong> {session.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <strong>Role:</strong>
                <Badge 
                  variant={userRole === "SUPERADMIN" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {userRole}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Switch Role:</p>
              {testUsers.map((user, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`w-full text-xs ${user.color} text-white border-none flex items-center justify-center`}
                  onClick={() => handleRoleSwitch(user)}
                  disabled={userRole === user.role}
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  {user.name}
                  {userRole === user.role && " (Current)"}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Quick Actions:</p>
              {availableActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`w-full text-xs ${action.color} text-white border-none`}
                  onClick={() => window.location.href = action.href}
                >
                  {action.label}
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => signOut()}
              >
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Development Mode Only
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
