"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function DevLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          password,
        }),
      });

      if (response.ok) {
        toast.success("Login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsSuperAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "superadmin@hospital.com",
          password: "superadmin123",
        }),
      });

      if (response.ok) {
        toast.success("SuperAdmin login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "SuperAdmin login failed");
      }
    } catch (error) {
      toast.error("An error occurred during SuperAdmin login");
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsAdmin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "admin@hospital.com",
          password: "admin123",
        }),
      });

      if (response.ok) {
        toast.success("Admin login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Admin login failed");
      }
    } catch (error) {
      toast.error("An error occurred during Admin login");
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDoctor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "doctor@hospital.com",
          password: "doctor123",
        }),
      });

      if (response.ok) {
        toast.success("Doctor login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Doctor login failed");
      }
    } catch (error) {
      toast.error("An error occurred during Doctor login");
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsReceptionist = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: "reception@hospital.com",
          password: "reception123",
        }),
      });

      if (response.ok) {
        toast.success("Receptionist login successful!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Receptionist login failed");
      }
    } catch (error) {
      toast.error("An error occurred during Receptionist login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Development Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Quick Login Options</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={loginAsSuperAdmin}
                className="flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                SuperAdmin
              </Button>
              <Button
                variant="outline"
                onClick={loginAsAdmin}
                className="flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-1 text-blue-500" />
                Admin
              </Button>
              <Button
                variant="outline"
                onClick={loginAsDoctor}
                className="flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-1 text-purple-500" />
                Doctor
              </Button>
              <Button
                variant="outline"
                onClick={loginAsReceptionist}
                className="flex items-center justify-center"
              >
                <CheckCircle className="w-4 h-4 mr-1 text-orange-500" />
                Reception
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Development Only</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This login page is only available in development mode for testing purposes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
