"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Award,
  Users,
  FileText,
  DollarSign,
  Clock,
  Star,
  Activity,
  Briefcase,
  GraduationCap,
  Building,
  User,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { ProfileData } from "./types";
import UserHistoryTimeline from "./user-history-timeline";
import ProfileCard from "./profile-card";
import AvailabilityRules from "./availability-rules";
import PublicCardGenerator from "./public-card-generator";
import { toast } from "react-hot-toast";

interface ProfileDisplayProps {
  userId?: string;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export default function ProfileDisplay({ 
  userId, 
  onEdit, 
  showEditButton = true 
}: ProfileDisplayProps) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showProfileCard, setShowProfileCard] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const targetUserId = userId || session?.user?.id;
  const isOwnProfile = !userId || userId === session?.user?.id;

  useEffect(() => {
    fetchProfile();
    fetchStatistics();
    fetchProfileImage();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const url = userId ? `/api/profile/${userId}` : "/api/profile/me";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Fetch prescriptions count
      const prescRes = await fetch(
        `/api/prescriptions?doctorId=${targetUserId}&count=true`
      );
      let prescriptionCount = 0;
      if (prescRes.ok) {
        const prescData = await prescRes.json();
        prescriptionCount = prescData.count || 0;
      }

      // Fetch revenue data
      const revenueRes = await fetch(
        `/api/bills?doctorId=${targetUserId}&revenue=true`
      );
      let totalRevenue = 0;
      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        totalRevenue = revenueData.totalRevenue || 0;
      }

      // Fetch appointment statistics
      const appointmentRes = await fetch(
        `/api/appointments?doctorId=${targetUserId}&stats=true`
      );
      let appointmentStats = {};
      if (appointmentRes.ok) {
        appointmentStats = await appointmentRes.json();
      }

      setStatistics({
        totalPrescriptions: prescriptionCount,
        totalRevenue,
        ...appointmentStats,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchProfileImage = async () => {
    try {
      const url = userId 
        ? `/api/profile/me/avatar?userId=${userId}` 
        : "/api/profile/me/avatar";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.avatarUrl) {
          setProfileImage(data.avatarUrl);
        }
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
    }
  };

  const calculateTotalExperience = () => {
    if (!profile?.experience?.length && !profile?.designation?.changelog?.length) {
      return 0;
    }

    const currentYear = new Date().getFullYear();
    let totalMonths = 0;

    // Calculate from experience entries
    profile?.experience?.forEach((exp) => {
      const startYear = exp.fromYear;
      const endYear = exp.toYear || currentYear;
      totalMonths += (endYear - startYear) * 12;
    });

    // Calculate from designation changelog
    profile?.designation?.changelog?.forEach((change) => {
      const startYear = change.fromYear;
      const endYear = change.toYear || currentYear;
      totalMonths += (endYear - startYear) * 12;
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  };

  const getRoleColor = (role: string) => {
    const colors = {
      DOCTOR: "bg-blue-100 text-blue-800",
      ADMIN: "bg-purple-100 text-purple-800",
      RECEPTIONIST: "bg-green-100 text-green-800",
      NURSE: "bg-pink-100 text-pink-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDepartmentIcon = (department: string) => {
    const icons = {
      Cardiology: "❤️",
      Neurology: "🧠",
      Orthopedics: "🦴",
      Pediatrics: "👶",
      Emergency: "🚨",
      Radiology: "🔬",
      Surgery: "✂️",
      Oncology: "🎗️",
    };
    return icons[department as keyof typeof icons] || "🏥";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Profile Data
        </h3>
        <p className="text-gray-600 mb-4">
          This user hasn't set up their profile yet.
        </p>
        {(isOwnProfile || isAdmin) && onEdit && (
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Set Up Profile
          </Button>
        )}
      </div>
    );
  }

  const totalExperience = calculateTotalExperience();

  return (
    <div className="space-y-6">
      {/* Header Card with Profile Image and Basic Info */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800 relative">
          {/* White overlay text section for better contrast */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/20 to-transparent h-20"></div>
        </div>
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6 -mt-16">
            {/* Profile Image */}
            <div className="relative mb-4 md:mb-0">
              <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={profile.fullName || "Profile"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Badge 
                  className={getRoleColor((session?.user as any)?.role || "USER")}
                >
                  {(session?.user as any)?.role || "USER"}
                </Badge>
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {profile.fullName || "Unnamed User"}
                  </h1>
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                    {profile.designation?.current && (
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-2" />
                        {profile.designation.current}
                      </div>
                    )}
                    {profile.department && (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="mr-2">
                          {getDepartmentIcon(profile.department)}
                        </span>
                        {profile.department}
                      </div>
                    )}
                    {totalExperience > 0 && (
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-2" />
                        {totalExperience} years experience
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {profile.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {profile.phone}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {profile.email}
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {profile.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfileCard(!showProfileCard)}
                  >
                    {showProfileCard ? (
                      <EyeOff className="w-4 h-4 mr-2" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {showProfileCard ? "Hide" : "Preview"} Public Card
                  </Button>
                  {showEditButton && (isOwnProfile || isAdmin) && onEdit && (
                    <Button onClick={onEdit}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards - Only for Doctors */}
      {((session?.user as any)?.role === "DOCTOR" || profile.designation?.current?.toLowerCase().includes("doctor")) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Prescriptions
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.totalPrescriptions || 0}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(statistics.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Patients
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statistics.totalPatients || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg. Rating
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statistics.averageRating || "N/A"}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Professional Details */}
          {profile.jobDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{profile.jobDescription}</p>
              </CardContent>
            </Card>
          )}

          {profile.responsibilities && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Key Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{profile.responsibilities}</p>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {profile.qualifications && profile.qualifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.qualifications.map((qual, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {qual.degree} in {qual.stream}
                        </h4>
                        {qual.institute && (
                          <p className="text-sm text-gray-600">{qual.institute}</p>
                        )}
                      </div>
                      {qual.year && (
                        <Badge variant="secondary">{qual.year}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* User History Timeline */}
          <UserHistoryTimeline 
            designationChangelog={profile.designation?.changelog || []}
            experience={profile.experience || []}
          />

          {/* Availability Rules - Only for Doctors */}
          {((session?.user as any)?.role === "DOCTOR" || profile.designation?.current?.toLowerCase().includes("doctor")) && (
            <AvailabilityRules userId={targetUserId} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Specializations */}
          {profile.specializations && profile.specializations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-600" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, index) => (
                    <Badge key={index} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">
                  {new Date().getFullYear() - (totalExperience || 1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Experience</span>
                <span className="font-medium">{totalExperience} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Qualifications</span>
                <span className="font-medium">
                  {profile.qualifications?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Previous Roles</span>
                <span className="font-medium">
                  {profile.designation?.changelog?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-gray-600" />
                Profile Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const fields = [
                  !!profile.fullName,
                  !!profile.phone,
                  !!profile.department,
                  !!profile.designation?.current,
                  !!profile.qualifications?.length,
                  !!profileImage,
                ];
                const completion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
                return (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Completion</span>
                      <span className="font-medium">{completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Public Card Generator */}
      {(isOwnProfile || isAdmin) && (
        <PublicCardGenerator 
          userId={targetUserId}
          profileData={profile}
        />
      )}

      {/* Public Profile Card Preview */}
      {showProfileCard && (
        <Card>
          <CardHeader>
            <CardTitle>Public Profile Card Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileCard 
              profile={profile} 
              role={(session?.user as any)?.role || "USER"}
              profileImage={profileImage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
