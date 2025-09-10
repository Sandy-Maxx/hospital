"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  User as UserIcon,
  ListChecks,
  Settings,
  Briefcase,
  Star,
  Upload,
  Camera,
  X,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ProfileData } from "./types";
import { toast } from "react-hot-toast";

const DEGREE_OPTIONS = [
  "High School",
  "Diploma",
  "BSc",
  "BPharm",
  "BTech",
  "MBBS",
  "MD",
  "MS",
  "MSc",
  "MPharm",
  "MTech",
  "PhD",
];

const STREAM_OPTIONS = [
  "Science",
  "Arts",
  "Commerce",
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "Neurology",
  "Radiology",
  "Oncology",
  "Psychiatry",
  "Dermatology",
];

const DEPARTMENT_OPTIONS = [
  "Cardiology",
  "Emergency",
  "General Medicine",
  "Pediatrics",
  "Orthopedics",
  "Neurology",
  "Oncology",
  "Radiology",
  "Surgery",
  "Psychiatry",
  "Dermatology",
  "Obstetrics & Gynecology",
];

const DESIGNATION_OPTIONS = [
  "Junior Doctor",
  "Senior Doctor",
  "Consultant",
  "Head of Department",
  "Chief Medical Officer",
  "Nurse",
  "Head Nurse",
  "Nursing Supervisor",
  "Receptionist",
  "Administrator",
  "IT Administrator",
];

const SPECIALIZATION_OPTIONS = [
  "Interventional Cardiology",
  "Pediatric Cardiology",
  "Emergency Medicine",
  "Critical Care",
  "Orthopedic Surgery",
  "Joint Replacement",
  "Spine Surgery",
  "Pediatric Neurology",
  "Stroke Medicine",
  "Medical Oncology",
  "Surgical Oncology",
  "Diagnostic Radiology",
  "Interventional Radiology",
];

function StepIndicator({ step, total, steps }: { step: number; total: number; steps: any[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((stepData, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                index <= step
                  ? "bg-primary-600 border-primary-600 text-white"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {index < step ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                React.createElement(stepData.icon, { className: "w-5 h-5" })
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 w-20 mx-2 transition-all ${
                  index < step ? "bg-primary-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-600 text-center">
        Step {step + 1} of {total}: {steps[step]?.title}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfileWizardEnhanced({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    qualifications: [],
    experience: [],
    specializations: [],
    designation: { current: "", changelog: [] },
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const targetUserId =
    isAdmin && searchParams?.get("userId")
      ? String(searchParams.get("userId"))
      : undefined;

  const fullSteps = [
    { key: "personal", title: "Personal Information", icon: UserIcon },
    { key: "professional", title: "Professional Details", icon: Briefcase },
    { key: "qualifications", title: "Education & Qualifications", icon: GraduationCap },
    { key: "experience", title: "Work Experience", icon: ListChecks },
    { key: "specializations", title: "Skills & Specializations", icon: Star },
    { key: "review", title: "Review & Complete", icon: CheckCircle2 },
  ];

  const limitedSteps = [
    { key: "personal", title: "Personal Information", icon: UserIcon },
    { key: "review", title: "Review & Save", icon: CheckCircle2 },
  ];

  const steps = useMemo(() => (isAdmin ? fullSteps : limitedSteps), [isAdmin]);

  useEffect(() => {
    fetchProfile();
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const url = targetUserId
        ? `/api/profile/${targetUserId}`
        : "/api/profile/me";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({ ...prev, ...data }));
      }
      
      // Fetch profile image
      const imgUrl = targetUserId
        ? `/api/profile/${targetUserId}/avatar`
        : "/api/profile/me/avatar";
      const imgRes = await fetch(imgUrl);
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        setProfileImage(imgData.avatarUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const body: any = { dataUrl: reader.result as string };
        if (isAdmin && targetUserId) body.userId = targetUserId;
        
        const response = await fetch("/api/profile/me/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfileImage(data.avatarUrl);
          toast.success("Profile image updated successfully!");
        } else {
          throw new Error("Failed to upload image");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addSpecialization = (spec: string) => {
    if (!profile.specializations?.includes(spec)) {
      setProfile((prev) => ({
        ...prev,
        specializations: [...(prev.specializations || []), spec],
      }));
    }
  };

  const removeSpecialization = (spec: string) => {
    setProfile((prev) => ({
      ...prev,
      specializations: prev.specializations?.filter(s => s !== spec) || [],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const url = targetUserId
        ? `/api/profile/${targetUserId}`
        : "/api/profile/me";
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success("Profile updated successfully!");
        setStep(steps.length - 1);
        try { onSuccess && onSuccess(); } catch {}
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const StepPersonal = (
    <div className="space-y-6">
      {/* Profile Image Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <UserIcon className="w-12 h-12" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={uploadingImage}
            />
          </label>
        </div>
        <p className="text-sm text-gray-600">Click the camera icon to upload your photo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name *
          </Label>
          <Input
            id="fullName"
            value={profile.fullName || ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, fullName: e.target.value }))
            }
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number *
          </Label>
          <Input
            id="phone"
            value={profile.phone || ""}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Enter your phone number"
          />
        </div>
        {isAdmin && (
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="Enter email address"
            />
          </div>
        )}
        <div className="md:col-span-2">
          <Label htmlFor="address" className="text-sm font-medium text-gray-700">
            Address
          </Label>
          <Textarea
            id="address"
            value={profile.address || ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, address: e.target.value }))
            }
            placeholder="Enter your address"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const StepProfessional = isAdmin ? (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="department" className="text-sm font-medium text-gray-700">
            Department *
          </Label>
          <select
            id="department"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            value={profile.department || ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, department: e.target.value }))
            }
          >
            <option value="">Select Department</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="designation" className="text-sm font-medium text-gray-700">
            Current Designation *
          </Label>
          <select
            id="designation"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            value={profile.designation?.current || ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                designation: {
                  ...(p.designation || {}),
                  current: e.target.value,
                  changelog: p.designation?.changelog || [],
                },
              }))
            }
          >
            <option value="">Select Designation</option>
            {DESIGNATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="jobDescription" className="text-sm font-medium text-gray-700">
          Job Description
        </Label>
        <Textarea
          id="jobDescription"
          value={profile.jobDescription || ""}
          onChange={(e) =>
            setProfile((p) => ({ ...p, jobDescription: e.target.value }))
          }
          placeholder="Describe your role and responsibilities"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="responsibilities" className="text-sm font-medium text-gray-700">
          Key Responsibilities
        </Label>
        <Textarea
          id="responsibilities"
          value={profile.responsibilities || ""}
          onChange={(e) =>
            setProfile((p) => ({ ...p, responsibilities: e.target.value }))
          }
          placeholder="List your key responsibilities"
          rows={4}
        />
      </div>
    </div>
  ) : (
    <div className="text-center py-12">
      <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Professional Details
      </h3>
      <p className="text-gray-600">
        Only administrators can edit professional details. Please contact your administrator for changes.
      </p>
    </div>
  );

  // Continue with other steps...
  const renderCurrentStep = () => {
    const currentKey = steps[step]?.key;
    switch (currentKey) {
      case "personal":
        return StepPersonal;
      case "professional":
        return StepProfessional;
      case "qualifications":
        return isAdmin ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Education & Qualifications</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    qualifications: [
                      ...(p.qualifications || []),
                      { degree: "", stream: "" },
                    ],
                  }))
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Qualification
              </Button>
            </div>
            <div className="space-y-4">
              {(profile.qualifications || []).map((qual, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Degree</Label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        value={qual.degree}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            qualifications: (p.qualifications || []).map((q, i) =>
                              i === index ? { ...q, degree: e.target.value } : q
                            ),
                          }))
                        }
                      >
                        <option value="">Select Degree</option>
                        {DEGREE_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Stream</Label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                        value={qual.stream}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            qualifications: (p.qualifications || []).map((q, i) =>
                              i === index ? { ...q, stream: e.target.value } : q
                            ),
                          }))
                        }
                      >
                        <option value="">Select Stream</option>
                        {STREAM_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Institute</Label>
                      <Input
                        placeholder="Institute name"
                        value={qual.institute || ""}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            qualifications: (p.qualifications || []).map((q, i) =>
                              i === index ? { ...q, institute: e.target.value } : q
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Year</Label>
                      <Input
                        type="number"
                        placeholder="Year"
                        value={qual.year || ""}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            qualifications: (p.qualifications || []).map((q, i) =>
                              i === index ? { ...q, year: Number(e.target.value) } : q
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            qualifications: (p.qualifications || []).filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Only administrators can edit qualifications.</p>
          </div>
        );
      case "experience":
        return isAdmin ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    experience: [
                      ...(p.experience || []),
                      {
                        organization: "",
                        designation: "",
                        fromYear: new Date().getFullYear(),
                      },
                    ],
                  }))
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
            <div className="space-y-4">
              {(profile.experience || []).map((exp, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <Label className="text-sm font-medium text-gray-700">Organization</Label>
                      <Input
                        placeholder="Company/Hospital name"
                        value={exp.organization}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            experience: (p.experience || []).map((exp, i) =>
                              i === index ? { ...exp, organization: e.target.value } : exp
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Position</Label>
                      <Input
                        placeholder="Job title"
                        value={exp.designation}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            experience: (p.experience || []).map((exp, i) =>
                              i === index ? { ...exp, designation: e.target.value } : exp
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-700">From Year</Label>
                      <Input
                        type="number"
                        value={exp.fromYear || ""}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            experience: (p.experience || []).map((exp, i) =>
                              i === index ? { ...exp, fromYear: Number(e.target.value) } : exp
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-700">To Year</Label>
                      <Input
                        type="number"
                        placeholder="Present"
                        value={exp.toYear || ""}
                        onChange={(e) =>
                          setProfile((p) => ({
                            ...p,
                            experience: (p.experience || []).map((exp, i) =>
                              i === index
                                ? {
                                    ...exp,
                                    toYear: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  }
                                : exp
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            experience: (p.experience || []).filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <ListChecks className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Only administrators can edit experience.</p>
          </div>
        );
      case "specializations":
        return isAdmin ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Specializations</h3>
              <p className="text-gray-600 mb-6">Add your skills and areas of specialization</p>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Available Specializations</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SPECIALIZATION_OPTIONS.filter(
                      spec => !profile.specializations?.includes(spec)
                    ).map((spec) => (
                      <Badge
                        key={spec}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary-50 hover:border-primary-300"
                        onClick={() => addSpecialization(spec)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {profile.specializations && profile.specializations.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Your Specializations</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.specializations.map((spec) => (
                        <Badge
                          key={spec}
                          variant="default"
                          className="cursor-pointer"
                          onClick={() => removeSpecialization(spec)}
                        >
                          {spec}
                          <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Only administrators can edit specializations.</p>
          </div>
        );
      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h3>
              <p className="text-gray-600">Please review all information before saving</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {profile.fullName || "Not provided"}</div>
                  <div><strong>Phone:</strong> {profile.phone || "Not provided"}</div>
                  <div><strong>Email:</strong> {profile.email || "Not provided"}</div>
                  <div><strong>Address:</strong> {profile.address || "Not provided"}</div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Professional Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Department:</strong> {profile.department || "Not provided"}</div>
                  <div><strong>Designation:</strong> {profile.designation?.current || "Not provided"}</div>
                  <div><strong>Qualifications:</strong> {profile.qualifications?.length || 0} entries</div>
                  <div><strong>Experience:</strong> {profile.experience?.length || 0} entries</div>
                  <div><strong>Specializations:</strong> {profile.specializations?.length || 0} skills</div>
                </div>
              </Card>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isAdmin && targetUserId ? "Edit User Profile" : "My Profile"}
          </h1>
          <p className="text-gray-600">
            {isAdmin && targetUserId
              ? "Update user information and professional details"
              : "Complete your profile to get started"}
          </p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <StepIndicator step={step} total={steps.length} steps={steps} />
            
            <div className="min-h-[500px]">
              {renderCurrentStep()}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center space-x-2">
                {step < steps.length - 1 ? (
                  <Button
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
