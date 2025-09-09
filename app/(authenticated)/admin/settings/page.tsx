"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Save,
  Palette,
  Settings,
  Eye,
  Clock,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

interface SessionTemplate {
  id: string;
  name: string;
  shortCode: string;
  startTime: string;
  endTime: string;
  maxTokens: number;
  isActive: boolean;
}

interface HospitalSettings {
  name: string;
  tagline: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  email: string;
  address: string;
  vision: string;
  mission: string;
  // Appointment Settings
  tokenPrefix: string;
  sessionPrefix: string;
  defaultSessionDuration: number;
  maxTokensPerSession: number;
  allowPublicBooking: boolean;
  requirePatientDetails: boolean;
  autoAssignTokens: boolean;
  enableCarryForward: boolean;
  // Business Hours
  businessStartTime: string;
  businessEndTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  // Session Templates
  sessionTemplates: SessionTemplate[];
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<HospitalSettings>({
    name: "MediCare Hospital",
    tagline: "Your Health, Our Priority",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    phone: "+1 (555) 123-4567",
    email: "info@medicare.com",
    address: "123 Health Street, Medical City, MC 12345",
    vision:
      "To be the leading healthcare provider, delivering exceptional medical care with compassion and innovation.",
    mission:
      "We are committed to providing comprehensive, patient-centered healthcare services that promote healing, wellness, and quality of life for our community.",
    // Appointment Settings
    tokenPrefix: "T",
    sessionPrefix: "S",
    defaultSessionDuration: 240,
    maxTokensPerSession: 50,
    allowPublicBooking: true,
    requirePatientDetails: true,
    autoAssignTokens: true,
    enableCarryForward: true,
    // Business Hours
    businessStartTime: "09:00",
    businessEndTime: "17:00",
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
    // Session Templates
    sessionTemplates: [
      {
        id: "1",
        name: "Morning",
        shortCode: "S1",
        startTime: "09:00",
        endTime: "13:00",
        maxTokens: 50,
        isActive: true,
      },
      {
        id: "2",
        name: "Afternoon",
        shortCode: "S2",
        startTime: "14:00",
        endTime: "17:00",
        maxTokens: 40,
        isActive: true,
      },
      {
        id: "3",
        name: "Evening",
        shortCode: "S3",
        startTime: "17:00",
        endTime: "20:00",
        maxTokens: 30,
        isActive: false,
      },
    ],
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionTemplate | null>(
    null,
  );
  const [showSessionForm, setShowSessionForm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/hospital");
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/hospital", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Error saving settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  const handleSessionChange = (
    sessionId: string,
    field: string,
    value: any,
  ) => {
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.map((session) =>
        session.id === sessionId ? { ...session, [field]: value } : session,
      ),
    }));
  };

  const addSession = () => {
    const newSession: SessionTemplate = {
      id: Date.now().toString(),
      name: "New Session",
      shortCode: `S${settings.sessionTemplates.length + 1}`,
      startTime: "09:00",
      endTime: "13:00",
      maxTokens: 50,
      isActive: true,
    };
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: [...prev.sessionTemplates, newSession],
    }));
  };

  const removeSession = (sessionId: string) => {
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.filter(
        (session) => session.id !== sessionId,
      ),
    }));
  };

  const toggleSessionActive = (sessionId: string) => {
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: prev.sessionTemplates.map((session) =>
        session.id === sessionId
          ? { ...session, isActive: !session.isActive }
          : session,
      ),
    }));
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSettings((prev) => ({ ...prev, logo: result.url }));
        alert("Logo uploaded successfully!");
      } else {
        alert(result.error || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload logo");
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Admin privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hospital Settings
          </h1>
          <p className="text-gray-600">
            Configure your hospital's branding and information
          </p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Clock className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="content">
            <Eye className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure your hospital's basic information and identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={settings.tagline}
                    onChange={(e) =>
                      handleInputChange("tagline", e.target.value)
                    }
                    placeholder="Enter hospital tagline"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo Upload</CardTitle>
              <CardDescription>
                Upload your hospital's logo (recommended size: 200x200px)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  {settings.logo ? (
                    <img
                      src={settings.logo}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? "Uploading..." : "Upload Logo"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Settings</CardTitle>
              <CardDescription>
                Configure appointment booking and token management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenPrefix">Token Prefix</Label>
                  <Input
                    id="tokenPrefix"
                    value={settings.tokenPrefix}
                    onChange={(e) =>
                      handleInputChange("tokenPrefix", e.target.value)
                    }
                    placeholder="T"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionPrefix">Session Prefix</Label>
                  <Input
                    id="sessionPrefix"
                    value={settings.sessionPrefix}
                    onChange={(e) =>
                      handleInputChange("sessionPrefix", e.target.value)
                    }
                    placeholder="S"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTokensPerSession">
                    Max Tokens Per Session
                  </Label>
                  <Input
                    id="maxTokensPerSession"
                    type="number"
                    value={settings.maxTokensPerSession}
                    onChange={(e) =>
                      handleInputChange(
                        "maxTokensPerSession",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultSessionDuration">
                    Default Session Duration (minutes)
                  </Label>
                  <Input
                    id="defaultSessionDuration"
                    type="number"
                    value={settings.defaultSessionDuration}
                    onChange={(e) =>
                      handleInputChange(
                        "defaultSessionDuration",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    placeholder="240"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowPublicBooking"
                    checked={settings.allowPublicBooking}
                    onChange={(e) =>
                      handleInputChange("allowPublicBooking", e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="allowPublicBooking">
                    Allow Public Booking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoAssignTokens"
                    checked={settings.autoAssignTokens}
                    onChange={(e) =>
                      handleInputChange("autoAssignTokens", e.target.checked)
                    }
                    className="rounded"
                  />
                  <Label htmlFor="autoAssignTokens">Auto Assign Tokens</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requirePatientDetails"
                    checked={settings.requirePatientDetails}
                    onChange={(e) =>
                      handleInputChange(
                        "requirePatientDetails",
                        e.target.checked,
                      )
                    }
                    className="rounded"
                  />
                  <Label htmlFor="requirePatientDetails">
                    Require Patient Details
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Set your hospital's operating hours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessStartTime">Business Start Time</Label>
                  <Input
                    id="businessStartTime"
                    type="time"
                    value={settings.businessStartTime}
                    onChange={(e) =>
                      handleInputChange("businessStartTime", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEndTime">Business End Time</Label>
                  <Input
                    id="businessEndTime"
                    type="time"
                    value={settings.businessEndTime}
                    onChange={(e) =>
                      handleInputChange("businessEndTime", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lunchBreakStart">Lunch Break Start</Label>
                  <Input
                    id="lunchBreakStart"
                    type="time"
                    value={settings.lunchBreakStart}
                    onChange={(e) =>
                      handleInputChange("lunchBreakStart", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunchBreakEnd">Lunch Break End</Label>
                  <Input
                    id="lunchBreakEnd"
                    type="time"
                    value={settings.lunchBreakEnd}
                    onChange={(e) =>
                      handleInputChange("lunchBreakEnd", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Session Templates</CardTitle>
                  <CardDescription>
                    Configure appointment session templates that will be used to
                    create daily sessions
                  </CardDescription>
                </div>
                <Button onClick={addSession}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.sessionTemplates.map((session, index) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Session Name</Label>
                        <Input
                          value={session.name}
                          onChange={(e) =>
                            handleSessionChange(
                              session.id,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder="Morning"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Short Code</Label>
                        <Input
                          value={session.shortCode}
                          onChange={(e) =>
                            handleSessionChange(
                              session.id,
                              "shortCode",
                              e.target.value,
                            )
                          }
                          placeholder="S1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={session.startTime}
                          onChange={(e) =>
                            handleSessionChange(
                              session.id,
                              "startTime",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={session.endTime}
                          onChange={(e) =>
                            handleSessionChange(
                              session.id,
                              "endTime",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Tokens</Label>
                        <Input
                          type="number"
                          value={session.maxTokens}
                          onChange={(e) =>
                            handleSessionChange(
                              session.id,
                              "maxTokens",
                              parseInt(e.target.value),
                            )
                          }
                          placeholder="50"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSessionActive(session.id)}
                          className={
                            session.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {session.isActive ? "Active" : "Inactive"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {settings.sessionTemplates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No session templates configured</p>
                    <p className="text-sm">
                      Add session templates to enable appointment booking
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Configure your hospital's brand colors for consistent styling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) =>
                        handleInputChange("primaryColor", e.target.value)
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) =>
                        handleInputChange("primaryColor", e.target.value)
                      }
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) =>
                        handleInputChange("secondaryColor", e.target.value)
                      }
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={(e) =>
                        handleInputChange("secondaryColor", e.target.value)
                      }
                      placeholder="#1e40af"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Color Preview</h4>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: settings.primaryColor }}
                    ></div>
                    <span className="text-sm">Primary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: settings.secondaryColor }}
                    ></div>
                    <span className="text-sm">Secondary</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vision & Mission</CardTitle>
              <CardDescription>
                Define your hospital's vision and mission statements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vision">Vision Statement</Label>
                <Textarea
                  id="vision"
                  value={settings.vision}
                  onChange={(e) => handleInputChange("vision", e.target.value)}
                  placeholder="Enter your hospital's vision statement"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  value={settings.mission}
                  onChange={(e) => handleInputChange("mission", e.target.value)}
                  placeholder="Enter your hospital's mission statement"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Configure your hospital's contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="info@hospital.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter hospital address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Add your hospital's social media profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={settings.socialMedia.facebook || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("facebook", e.target.value)
                    }
                    placeholder="https://facebook.com/yourhospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={settings.socialMedia.twitter || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("twitter", e.target.value)
                    }
                    placeholder="https://twitter.com/yourhospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settings.socialMedia.instagram || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("instagram", e.target.value)
                    }
                    placeholder="https://instagram.com/yourhospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={settings.socialMedia.linkedin || ""}
                    onChange={(e) =>
                      handleSocialMediaChange("linkedin", e.target.value)
                    }
                    placeholder="https://linkedin.com/company/yourhospital"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
