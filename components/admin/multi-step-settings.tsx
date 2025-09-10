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
import {
  Building,
  Settings,
  Clock,
  Calendar,
  Users,
  Save,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Palette,
  Globe,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Timer,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface SessionTemplate {
  id: string;
  name: string;
  shortCode: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
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
  // Business Hours
  businessStartTime: string;
  businessEndTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  // Weekly Schedule
  weeklySchedule: {
    [key: string]: { isOpen: boolean; startTime: string; endTime: string };
  };
  // Session Templates
  sessionTemplates: SessionTemplate[];
  // Appointment Settings
  tokenPrefix: string;
  maxTokensPerSession: number;
  allowPublicBooking: boolean;
  requirePatientDetails: boolean;
  autoAssignTokens: boolean;
  enableCarryForward: boolean;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  // Public URLs
  publicBaseUrl?: string;
}

const steps = [
  {
    id: 1,
    title: "Hospital Information",
    description: "Basic hospital details and branding",
    icon: Building,
    color: "bg-blue-500",
  },
  {
    id: 2,
    title: "Business Hours",
    description: "Operating hours and weekly schedule",
    icon: Clock,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "Session Templates",
    description: "Configure appointment session templates",
    icon: Users,
    color: "bg-purple-500",
  },
  {
    id: 4,
    title: "Advanced Settings",
    description: "Appointment settings and social media",
    icon: Settings,
    color: "bg-orange-500",
  },
];

const weekDays = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function MultiStepSettings() {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState<HospitalSettings>({
    name: "MediCare Hospital",
    tagline: "Your Health, Our Priority",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    phone: "+1 (555) 123-4567",
    email: "info@medicare.com",
    address: "123 Health Street, Medical City, MC 12345",
    vision: "To be the leading healthcare provider, delivering exceptional medical care with compassion and innovation.",
    mission: "We are committed to providing comprehensive, patient-centered healthcare services that promote healing, wellness, and quality of life for our community.",
    businessStartTime: "09:00",
    businessEndTime: "17:00",
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
    weeklySchedule: {
      monday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      tuesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      wednesday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      thursday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      friday: { isOpen: true, startTime: "09:00", endTime: "17:00" },
      saturday: { isOpen: true, startTime: "09:00", endTime: "14:00" },
      sunday: { isOpen: false, startTime: "09:00", endTime: "17:00" },
    },
    sessionTemplates: [
      {
        id: "1",
        name: "Morning",
        shortCode: "M",
        startTime: "09:00",
        endTime: "13:00",
        maxTokens: 50,
        isActive: true,
      },
      {
        id: "2",
        name: "Evening",
        shortCode: "E",
        startTime: "14:00",
        endTime: "17:00",
        maxTokens: 30,
        isActive: true,
      },
    ],
    tokenPrefix: "T",
    maxTokensPerSession: 50,
    allowPublicBooking: true,
    requirePatientDetails: true,
    autoAssignTokens: true,
    enableCarryForward: true,
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
    },
    publicBaseUrl: "",
  });

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
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const timeToMinutes = (t: string) => {
    const [h, m] = (t || "0:0").split(":").map(Number);
    return h * 60 + m;
  };

  const validateSessions = (): string[] => {
    const errors: string[] = [];
    const { businessStartTime, businessEndTime, lunchBreakStart, lunchBreakEnd, sessionTemplates } = settings as any;
    if (!businessStartTime || !businessEndTime) {
      errors.push("Hospital timings must be set before configuring sessions.");
      return errors;
    }
    const dayStart = timeToMinutes(businessStartTime);
    const dayEnd = timeToMinutes(businessEndTime);
    const lbStart = lunchBreakStart ? timeToMinutes(lunchBreakStart) : null;
    const lbEnd = lunchBreakEnd ? timeToMinutes(lunchBreakEnd) : null;
    if (lbStart !== null && lbEnd !== null) {
      if (lbStart >= lbEnd || lbStart < dayStart || lbEnd > dayEnd) {
        errors.push(`Invalid lunch break: must be within Business Hours and start before end.`);
      }
    }
    const sessions = (sessionTemplates || []) as SessionTemplate[];

    // Basic field checks
    sessions.forEach((s, idx) => {
      if (!s.name?.trim()) errors.push(`Session #${idx + 1}: Name is required.`);
      if (!s.shortCode?.trim()) errors.push(`Session #${idx + 1}: Short code is required.`);
      if (!s.startTime || !s.endTime) errors.push(`Session #${idx + 1}: Start and end time are required.`);
      const sStart = timeToMinutes(s.startTime || "00:00");
      const sEnd = timeToMinutes(s.endTime || "00:00");
      if (sStart >= sEnd) errors.push(`Session "${s.name}": Start time must be before end time.`);
      if (sStart < dayStart || sEnd > dayEnd) errors.push(`Session "${s.name}": Must be within Business Hours (${businessStartTime} - ${businessEndTime}).`);
      if (lbStart !== null && lbEnd !== null && lbStart < lbEnd) {
        if (Math.max(sStart, lbStart) < Math.min(sEnd, lbEnd)) {
          errors.push(`Session "${s.name}": Cannot overlap lunch break (${lunchBreakStart} - ${lunchBreakEnd}).`);
        }
      }
    });

    // Overlap checks
    const sorted = [...sessions].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevEnd = timeToMinutes(prev.endTime);
      const currStart = timeToMinutes(curr.startTime);
      if (currStart < prevEnd) {
        errors.push(`Sessions "${prev.name}" and "${curr.name}" overlap.`);
      }
    }
    return errors;
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const errors = validateSessions();
      if (errors.length > 0) {
        toast.error(errors[0]);
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/settings/hospital", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully!");
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.error || "Error saving settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeeklyScheduleChange = (day: string, field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day],
          [field]: value,
        },
      },
    }));
  };

  const addSession = () => {
    const newSession: SessionTemplate = {
      id: Date.now().toString(),
      name: "New Session",
      shortCode: "",
      startTime: settings.businessStartTime || "09:00",
      endTime: settings.lunchBreakStart || "13:00",
      maxTokens: 50,
      isActive: true,
    };
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: [...(prev.sessionTemplates || []), newSession],
    }));
  };

  const timeOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  };

  const updateSession = (sessionId: string, field: keyof SessionTemplate, value: any) => {
    // Allow free editing; validation will happen when moving to the next step or on save
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: (prev.sessionTemplates || []).map((session) =>
        session.id === sessionId ? { ...session, [field]: value } : session
      ),
    }));
  };

  const removeSession = (sessionId: string) => {
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: (prev.sessionTemplates || []).filter((session) => session.id !== sessionId),
    }));
  };

  const toggleSessionActive = (sessionId: string) => {
    setSettings((prev) => ({
      ...prev,
      sessionTemplates: (prev.sessionTemplates || []).map((session) =>
        session.id === sessionId
          ? { ...session, isActive: !session.isActive }
          : session
      ),
    }));
  };

  const nextStep = () => {
    // Enforce validation when leaving Session Templates step (step 3)
    if (currentStep === 3) {
      const errors = validateSessions();
      if (errors.length > 0) {
        toast.error(`Please fix Session Templates before continuing: ${errors[0]}`);
        return;
      }
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                currentStep >= step.id
                  ? `${step.color} text-white shadow-lg`
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {currentStep > step.id ? (
                <Check className="w-6 h-6" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>
            {step.id < steps.length && (
              <div
                className={`flex-1 h-2 mx-4 rounded-full transition-all duration-300 ${
                  currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                }`}
                style={{ width: "100px" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {steps[currentStep - 1]?.title}
        </h2>
        <p className="text-gray-600 mt-1">
          {steps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Hospital Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={settings.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="mt-1"
            placeholder="Enter hospital name"
          />
        </div>
        <div>
          <Label htmlFor="tagline" className="text-sm font-medium text-gray-700">
            Tagline
          </Label>
          <Input
            id="tagline"
            value={settings.tagline}
            onChange={(e) => handleInputChange("tagline", e.target.value)}
            className="mt-1"
            placeholder="Enter hospital tagline"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            value={settings.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="mt-1"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={settings.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="mt-1"
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 inline mr-2" />
          Address
        </Label>
        <Textarea
          id="address"
          value={settings.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          className="mt-1"
          rows={3}
          placeholder="Enter hospital address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="primaryColor" className="text-sm font-medium text-gray-700">
            <Palette className="w-4 h-4 inline mr-2" />
            Primary Color
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="primaryColor"
              type="color"
              value={settings.primaryColor}
              onChange={(e) => handleInputChange("primaryColor", e.target.value)}
              className="w-16 h-10"
            />
            <Input
              value={settings.primaryColor}
              onChange={(e) => handleInputChange("primaryColor", e.target.value)}
              className="flex-1"
              placeholder="#2563eb"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="secondaryColor" className="text-sm font-medium text-gray-700">
            <Palette className="w-4 h-4 inline mr-2" />
            Secondary Color
          </Label>
          <div className="flex items-center space-x-2 mt-1">
            <Input
              id="secondaryColor"
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
              className="w-16 h-10"
            />
            <Input
              value={settings.secondaryColor}
              onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
              className="flex-1"
              placeholder="#1e40af"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="vision" className="text-sm font-medium text-gray-700">
          Vision Statement
        </Label>
        <Textarea
          id="vision"
          value={settings.vision}
          onChange={(e) => handleInputChange("vision", e.target.value)}
          className="mt-1"
          rows={3}
          placeholder="Enter hospital vision"
        />
      </div>

      <div>
        <Label htmlFor="mission" className="text-sm font-medium text-gray-700">
          Mission Statement
        </Label>
        <Textarea
          id="mission"
          value={settings.mission}
          onChange={(e) => handleInputChange("mission", e.target.value)}
          className="mt-1"
          rows={3}
          placeholder="Enter hospital mission"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Clock className="w-5 h-5 inline mr-2" />
          Weekly Operating Hours
        </h3>
        <div className="grid gap-4">
          {weekDays.map((day) => (
            <div key={day.key} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-20">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.weeklySchedule[day.key]?.isOpen}
                    onChange={(e) =>
                      handleWeeklyScheduleChange(day.key, "isOpen", e.target.checked)
                    }
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{day.label}</span>
                </label>
              </div>
              {settings.weeklySchedule[day.key]?.isOpen && (
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    type="time"
                    value={settings.weeklySchedule[day.key]?.startTime}
                    onChange={(e) =>
                      handleWeeklyScheduleChange(day.key, "startTime", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={settings.weeklySchedule[day.key]?.endTime}
                    onChange={(e) =>
                      handleWeeklyScheduleChange(day.key, "endTime", e.target.value)
                    }
                    className="w-32"
                  />
                </div>
              )}
              {!settings.weeklySchedule[day.key]?.isOpen && (
                <div className="flex-1 text-sm text-gray-500 italic">Closed</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="lunchBreakStart" className="text-sm font-medium text-gray-700">
            Lunch Break Start
          </Label>
          <Input
            id="lunchBreakStart"
            type="time"
            value={settings.lunchBreakStart}
            onChange={(e) => handleInputChange("lunchBreakStart", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lunchBreakEnd" className="text-sm font-medium text-gray-700">
            Lunch Break End
          </Label>
          <Input
            id="lunchBreakEnd"
            type="time"
            value={settings.lunchBreakEnd}
            onChange={(e) => handleInputChange("lunchBreakEnd", e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Users className="w-5 h-5 inline mr-2" />
            Session Templates
          </h3>
          <Button onClick={addSession} size="sm" className="flex items-center">
            <Plus className="w-4 h-4 mr-1" />
            Add Session
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Create session templates with unique short codes and time ranges. These codes will be used in token numbers (e.g., Token: TM001 for Morning session).
        </p>
        
        {(settings.sessionTemplates || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Timer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No session templates configured</p>
            <p className="text-sm">Add session templates to organize appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(settings.sessionTemplates || []).map((session) => (
              <div key={session.id} className="bg-white p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Session Name</Label>
                    <Input
                      value={session.name}
                      onChange={(e) => updateSession(session.id, "name", e.target.value)}
                      placeholder="Morning"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Short Code</Label>
                    <Input
                      value={session.shortCode}
                      onChange={(e) => updateSession(session.id, "shortCode", e.target.value.toUpperCase())}
                      placeholder="M"
                      maxLength={2}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used in tokens</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Start Time</Label>
                    <Input
                      type="time"
                      value={session.startTime}
                      onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">End Time</Label>
                    <Input
                      type="time"
                      value={session.endTime}
                      onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1">Max Tokens</Label>
                    <Input
                      type="number"
                      value={session.maxTokens}
                      onChange={(e) => updateSession(session.id, "maxTokens", parseInt(e.target.value) || 0)}
                      min="1"
                      max="200"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSessionActive(session.id)}
                      className={session.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
                    >
                      {session.isActive ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSession(session.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {session.shortCode && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Token Preview:</strong> {settings.tokenPrefix}{session.shortCode}001, {settings.tokenPrefix}{session.shortCode}002, etc.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Calendar className="w-5 h-5 inline mr-2" />
          Appointment Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="tokenPrefix" className="text-sm font-medium text-gray-700">
              Token Prefix
            </Label>
            <Input
              id="tokenPrefix"
              value={settings.tokenPrefix}
              onChange={(e) => handleInputChange("tokenPrefix", e.target.value)}
              className="mt-1"
              placeholder="T"
              maxLength={3}
            />
            <p className="text-xs text-gray-500 mt-1">Used at the beginning of all tokens</p>
          </div>
          <div>
            <Label htmlFor="maxTokensPerSession" className="text-sm font-medium text-gray-700">
              Max Tokens Per Session
            </Label>
            <Input
              id="maxTokensPerSession"
              type="number"
              value={settings.maxTokensPerSession}
              onChange={(e) => handleInputChange("maxTokensPerSession", parseInt(e.target.value) || 0)}
              className="mt-1"
              min="10"
              max="200"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Booking Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.allowPublicBooking}
                onChange={(e) => handleInputChange("allowPublicBooking", e.target.checked)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-sm text-gray-700">Allow Public Booking</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.requirePatientDetails}
                onChange={(e) => handleInputChange("requirePatientDetails", e.target.checked)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-sm text-gray-700">Require Patient Details</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.autoAssignTokens}
                onChange={(e) => handleInputChange("autoAssignTokens", e.target.checked)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-sm text-gray-700">Auto Assign Tokens</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.enableCarryForward}
                onChange={(e) => handleInputChange("enableCarryForward", e.target.checked)}
                className="w-4 h-4 text-orange-600"
              />
              <span className="text-sm text-gray-700">Enable Carry Forward</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Globe className="w-5 h-5 inline mr-2" />
          Social Media Links
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="publicBaseUrl" className="text-sm font-medium text-gray-700">
              Public Base URL (used in QR links)
            </Label>
            <Input
              id="publicBaseUrl"
              value={settings.publicBaseUrl || ""}
              onChange={(e) => handleInputChange("publicBaseUrl", e.target.value)}
              className="mt-1"
              placeholder="https://myhospital.example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Set your public domain or LAN URL so QR links work on patient devices. Example: http://192.168.1.10:3000 during local testing.</p>
          </div>

          <div>
            <Label htmlFor="facebook" className="text-sm font-medium text-gray-700">
              Facebook URL
            </Label>
            <Input
              id="facebook"
              value={settings.socialMedia.facebook || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, facebook: e.target.value },
                }))
              }
              className="mt-1"
              placeholder="https://facebook.com/yourhospital"
            />
          </div>
          <div>
            <Label htmlFor="twitter" className="text-sm font-medium text-gray-700">
              Twitter URL
            </Label>
            <Input
              id="twitter"
              value={settings.socialMedia.twitter || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, twitter: e.target.value },
                }))
              }
              className="mt-1"
              placeholder="https://twitter.com/yourhospital"
            />
          </div>
          <div>
            <Label htmlFor="instagram" className="text-sm font-medium text-gray-700">
              Instagram URL
            </Label>
            <Input
              id="instagram"
              value={settings.socialMedia.instagram || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, instagram: e.target.value },
                }))
              }
              className="mt-1"
              placeholder="https://instagram.com/yourhospital"
            />
          </div>
          <div>
            <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">
              LinkedIn URL
            </Label>
            <Input
              id="linkedin"
              value={settings.socialMedia.linkedin || ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  socialMedia: { ...prev.socialMedia, linkedin: e.target.value },
                }))
              }
              className="mt-1"
              placeholder="https://linkedin.com/company/yourhospital"
            />
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">✅ Configuration Complete</h4>
        <p className="text-sm text-green-700">
          Review your settings and click "Save All Settings" to apply the changes.
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Administrator privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center">
            <Settings className="w-6 h-6 mr-3" />
            Hospital Settings Configuration
          </CardTitle>
          <CardDescription className="text-blue-100">
            Configure your hospital's information, operating hours, and system settings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {renderProgressBar()}
          
          <div className="min-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading settings...</p>
                </div>
              </div>
            ) : (
              renderCurrentStep()
            )}
          </div>
          
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex space-x-3">
              {currentStep < steps.length ? (
                <Button onClick={nextStep} className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="flex items-center bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save All Settings
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
