"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileDisplay from "@/components/profile/profile-display";
import ProfileWizardEnhanced from "@/components/profile/profile-wizard-enhanced";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Settings, Shield } from "lucide-react";
import { getUserPermissions, canUserEditProfile } from "@/lib/permissions";
import { toast } from "react-hot-toast";

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UnauthorizedState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to view your profile</p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get URL parameters
  const editMode = searchParams?.get("edit") === "true";
  const userId = searchParams?.get("userId") || undefined;
  const isViewingOtherUser = userId && userId !== session?.user?.id;
  
  // Permission checks
  const userPermissions = session?.user ? getUserPermissions(session.user) : null;
  const canEdit = session?.user ? canUserEditProfile(session.user, userId) : false;
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    
    // Check permissions for viewing other users
    if (isViewingOtherUser && !userPermissions?.canEditOtherUsers) {
      setError("You don't have permission to view other users' profiles");
      setLoading(false);
      return;
    }
    
    setShowEditForm(editMode);
    setLoading(false);
  }, [status, editMode, isViewingOtherUser, userPermissions]);
  
  const handleEditToggle = () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit this profile");
      return;
    }
    
    const newEditMode = !showEditForm;
    setShowEditForm(newEditMode);
    
    // Update URL to reflect edit state
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newEditMode) {
      params.set("edit", "true");
    } else {
      params.delete("edit");
    }
    
    const newUrl = `/profile${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  };
  
  const handleProfileUpdateSuccess = () => {
    setShowEditForm(false);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("edit");
    const newUrl = `/profile${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
    toast.success("Profile updated successfully!");
  };
  
  const retryLoad = () => {
    setError(null);
    setLoading(true);
    // Trigger re-load by refreshing the page
    router.refresh();
  };

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  // Authentication required
  if (status === "unauthenticated" || !session?.user) {
    return <UnauthorizedState />;
  }
  
  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={retryLoad} />;
  }

  // Edit form view
  if (showEditForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Button 
                variant="ghost" 
                onClick={handleEditToggle}
                className="flex items-center space-x-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Settings className="w-4 h-4" />
                <span>Edit Mode</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ProfileWizardEnhanced onSuccess={handleProfileUpdateSuccess} />
        </div>
      </div>
    );
  }

  // Main profile view
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProfileDisplay 
          userId={userId}
          onEdit={handleEditToggle}
          showEditButton={canEdit}
        />
      </div>
    </div>
  );
}
