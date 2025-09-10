"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Briefcase, 
  Building, 
  Award, 
  Star,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Users
} from "lucide-react";
import { ProfileData } from "./types";

interface ProfileCardProps {
  profile: ProfileData;
  role: string;
  profileImage?: string | null;
  layout?: "compact" | "detailed" | "minimal";
  showStats?: boolean;
  className?: string;
}

export default function ProfileCard({
  profile,
  role,
  profileImage,
  layout = "detailed",
  showStats = true,
  className = "",
}: ProfileCardProps) {
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

  const getRoleColor = (role: string) => {
    const colors = {
      DOCTOR: "bg-blue-100 text-blue-800",
      ADMIN: "bg-purple-100 text-purple-800",
      RECEPTIONIST: "bg-green-100 text-green-800",
      NURSE: "bg-pink-100 text-pink-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
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

    return Math.round(totalMonths / 12 * 10) / 10;
  };

  const totalExperience = calculateTotalExperience();

  if (layout === "minimal") {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={profile.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {profile.fullName || "Unnamed User"}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              {profile.designation?.current && (
                <>
                  <Briefcase className="w-3 h-3 mr-1" />
                  {profile.designation.current}
                </>
              )}
            </div>
          </div>
          <Badge className={getRoleColor(role)}>
            {role}
          </Badge>
        </div>
      </div>
    );
  }

  if (layout === "compact") {
    return (
      <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
        <div className="h-16 bg-gradient-to-r from-primary-600 to-primary-800"></div>
        <div className="p-4 -mt-8 relative">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={profile.fullName || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1 pt-2">
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {profile.fullName || "Unnamed User"}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {profile.designation?.current && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {profile.designation.current}
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    <span className="mr-2">{getDepartmentIcon(profile.department)}</span>
                    {profile.department}
                  </div>
                )}
              </div>
            </div>
            <Badge className={getRoleColor(role)}>
              {role}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  // Detailed layout (default)
  return (
    <div className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-shadow ${className}`}>
      <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800"></div>
      <div className="p-6 -mt-12 relative">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden mb-3">
            {profileImage ? (
              <img
                src={profileImage}
                alt={profile.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <h3 className="font-bold text-xl text-gray-900 mb-1">
            {profile.fullName || "Unnamed User"}
          </h3>
          <Badge className={getRoleColor(role)}>
            {role}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          {profile.designation?.current && (
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Briefcase className="w-4 h-4 mr-2" />
              {profile.designation.current}
            </div>
          )}
          {profile.department && (
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Building className="w-4 h-4 mr-2" />
              <span className="mr-2">{getDepartmentIcon(profile.department)}</span>
              {profile.department}
            </div>
          )}
          {totalExperience > 0 && (
            <div className="flex items-center justify-center text-sm text-gray-600">
              <Award className="w-4 h-4 mr-2" />
              {totalExperience} years experience
            </div>
          )}
        </div>

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Specializations
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.specializations.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                </Badge>
              ))}
              {profile.specializations.length > 3 && (
                <Badge variant="outline">
                  +{profile.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats for Doctors */}
        {showStats && (role === "DOCTOR" || profile.designation?.current?.toLowerCase().includes("doctor")) && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500">Prescriptions</div>
                <div className="text-lg font-bold text-blue-600">
                  <FileText className="w-4 h-4 inline mr-1" />
                  250+
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Patients</div>
                <div className="text-lg font-bold text-purple-600">
                  <Users className="w-4 h-4 inline mr-1" />
                  500+
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Rating</div>
                <div className="text-lg font-bold text-yellow-600">
                  <Star className="w-4 h-4 inline mr-1" />
                  4.8
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="border-t pt-4 space-y-2">
          {profile.phone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="w-3 h-3 mr-2" />
              {profile.phone}
            </div>
          )}
          {profile.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="w-3 h-3 mr-2" />
              {profile.email}
            </div>
          )}
          {profile.address && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="w-3 h-3 mr-2" />
              {profile.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
