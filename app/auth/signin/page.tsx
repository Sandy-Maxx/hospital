"use client";

import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials");
      } else if (result?.ok) {
        toast.success("Login successful");
        // Force a page refresh to ensure session is properly loaded
        window.location.href = "/dashboard";
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div className="flex justify-start mb-4">
            <Link 
              href="/" 
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors hover:underline"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Hospital Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Quick Login:</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const result = await signIn("credentials", {
                    email: "admin@hospital.com",
                    password: "Admin123!",
                    redirect: false,
                  });
                  if (result?.error) {
                    toast.error("Admin login failed");
                  } else if (result?.ok) {
                    toast.success("Admin login successful");
                    window.location.href = "/dashboard";
                  }
                } catch (error) {
                  toast.error("Login failed");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full text-left justify-start"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Login as Admin</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const result = await signIn("credentials", {
                    email: "doctor@hospital.com",
                    password: "doctor123",
                    redirect: false,
                  });
                  if (result?.error) {
                    toast.error("Doctor login failed");
                  } else if (result?.ok) {
                    toast.success("Doctor login successful");
                    window.location.href = "/doctor";
                  }
                } catch (error) {
                  toast.error("Login failed");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full text-left justify-start"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Login as Doctor</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const result = await signIn("credentials", {
                    email: "reception@hospital.com",
                    password: "reception123",
                    redirect: false,
                  });
                  if (result?.error) {
                    toast.error("Receptionist login failed");
                  } else if (result?.ok) {
                    toast.success("Receptionist login successful");
                    window.location.href = "/receptionist";
                  }
                } catch (error) {
                  toast.error("Login failed");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full text-left justify-start"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Login as Receptionist</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const result = await signIn("credentials", {
                    email: "nurse.mary@hospital.com",
                    password: "nurse123",
                    redirect: false,
                  });
                  if (result?.error) {
                    toast.error("Nurse login failed");
                  } else if (result?.ok) {
                    toast.success("Nurse login successful");
                    window.location.href = "/dashboard";
                  }
                } catch (error) {
                  toast.error("Login failed");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full text-left justify-start"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Login as Nurse</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
