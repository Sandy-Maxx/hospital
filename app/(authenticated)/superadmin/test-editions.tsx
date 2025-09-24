"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, Settings, CheckCircle, AlertCircle, 
  ArrowUpDown, Database, Server, Globe 
} from "lucide-react";
import toast from "react-hot-toast";
import { getEdition, updateEdition, type Edition } from "@/lib/edition";

export default function TestEditionsPanel() {
  const { data: session } = useSession();
  const [currentEdition, setCurrentEdition] = useState<Edition>(getEdition());
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user has superadmin role
  const isSuperAdmin = (session?.user as any)?.role === "SUPERADMIN";

  const handleEditionChange = async (newEdition: Edition) => {
    if (currentEdition === newEdition) return;
    
    setIsUpdating(true);
    try {
      // Call the updateEdition function
      const success = await updateEdition(newEdition);
      
      if (success) {
        setCurrentEdition(newEdition);
        toast.success(`Deployment updated to ${newEdition} edition successfully!`);
      } else {
        toast.error("Failed to update deployment edition");
      }
    } catch (error) {
      toast.error("Failed to update deployment edition");
    } finally {
      setIsUpdating(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-primary-600" />
          Test Editions Panel
        </h1>
        <p className="text-gray-600 mt-2">
          Test switching between different editions
        </p>
      </div>

      {/* Edition Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Deployment Edition Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-blue-700">
                Current Edition: <span className="font-bold">{currentEdition}</span>
              </p>
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
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {edition}
                    {currentEdition === edition && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    variant={currentEdition === edition ? "default" : "outline"}
                    onClick={() => handleEditionChange(edition)}
                    disabled={isUpdating || currentEdition === edition}
                  >
                    {currentEdition === edition ? "Current Edition" : "Switch to " + edition}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
