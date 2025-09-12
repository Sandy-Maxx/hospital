"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
import HospitalDateInput from "@/components/ui/hospital-date-input";
import ProblemCategoriesSelect from "@/components/ui/problem-categories-select";
import { getProblemCategory } from "@/lib/problem-categories";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";

interface Session {
  id: string;
  name: string;
  shortCode: string;
  date: string;
  startTime: string;
  endTime: string;
  maxTokens: number;
  currentTokens: number;
  isActive: boolean;
  doctor?: {
    id: string;
    name: string;
  };
}

interface BookingResult {
  appointment: any;
  tokenNumber: string;
  sessionInfo: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

function BookingPageInner() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(
    null,
  );
  const confirmationRef = useRef<HTMLDivElement>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hospitalSettings, setHospitalSettings] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Patient Information
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",

    // Appointment Details
    sessionId: "",
    doctorId: "", // Auto-assigned, not selected by user
    type: "CONSULTATION",
    priority: "NORMAL",
    notes: "",
    problemCategories: [] as string[], // Array of problem category IDs
  });

  // Load available sessions for selected date
  const loadSessions = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        let availableSessions = data.sessions || [];
        
        // Filter out sessions that have already passed if the selected date is today
        const selectedDate = new Date(date);
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();
        
        // New rule:
        // - If selected date is today: session is available when
        //   a) capacity not exhausted, and
        //   b) at least 10 minutes left until session end time
        // - For future dates: keep sessions that have capacity
        const hasCapacity = (s: Session) => (s.maxTokens - s.currentTokens) > 0;
        const toMinutes = (hhmm: string) => {
          const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
          return h * 60 + m;
        };

        if (isToday) {
          const currentTime = today.getHours() * 60 + today.getMinutes();
          availableSessions = availableSessions.filter((session: Session) => {
            if (!hasCapacity(session)) return false;
            const endMin = toMinutes(session.endTime);
            const startMin = toMinutes(session.startTime);
            // Handle cross-midnight: if end <= start, treat end as next-day end
            const normalizedEnd = endMin <= startMin ? endMin + 24 * 60 : endMin;
            const minutesLeft = normalizedEnd - currentTime;
            return minutesLeft >= 10; // at least 10 minutes remaining
          });
        } else {
          availableSessions = availableSessions.filter(hasCapacity);
        }
        
        setSessions(availableSessions);
      } else {
        toast.error("Failed to load available sessions");
      }
    } catch (error) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  // Load available doctors for session and problem categories
  const loadDoctorsForSession = async (sessionId: string, problemCategories: string[] = []) => {
    try {
      const queryParams = new URLSearchParams({
        sessionId: sessionId,
        ...(problemCategories.length > 0 && { problemCategories: problemCategories.join(',') })
      });
      
      const response = await fetch(`/api/doctors/available?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
        // Auto-assign best matching doctor based on specialization
        const bestDoctor = (data.doctors || [])[0]; // API should return doctors sorted by best match
        if (bestDoctor) {
          setFormData((prev) => ({ ...prev, doctorId: bestDoctor.id }));
        } else {
          setFormData((prev) => ({ ...prev, doctorId: "" }));
        }
      }
    } catch (error) {
      console.error("Failed to load available doctors:", error);
    }
  };

  // Load patient data if patientId is provided
  const loadPatientData = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        const patient = data.patient;
        setFormData((prev) => ({
          ...prev,
          firstName: patient.firstName || "",
          lastName: patient.lastName || "",
          phone: patient.phone || "",
          email: patient.email || "",
          dateOfBirth: patient.dateOfBirth || "",
          gender: patient.gender || "",
        }));
      }
    } catch (error) {
      console.error("Failed to load patient data:", error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadSessions(selectedDate);
    }

    // Auto-fill patient data if coming from patient details page
    const patientId = searchParams.get("patientId");
    if (patientId) {
      loadPatientData(patientId);
    }
  }, [selectedDate, searchParams]);

  // Load hospital branding for token header
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/hospital');
        if (res.ok) {
          const data = await res.json();
          setHospitalSettings(data);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { firstName, lastName, phone } = formData;
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    return formData.sessionId.trim() !== "" && formData.problemCategories.length > 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;
    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions to proceed");
      return;
    }

    setLoading(true);
    try {
      const bookingPayload = {
        ...formData,
        acceptedTerms: true,
        consentVersion: "2025-09-12",
      };
      const response = await fetch("/api/appointments/book-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingResult(data);
        setStep(4);
        toast.success("Appointment booked successfully!");
      } else {
        // Handle validation errors from API
        if (Array.isArray(data.error)) {
          // Zod validation errors
          const errorMessages = data.error
            .map((err: any) => err.message)
            .join(", ");
          toast.error(errorMessages);
        } else if (typeof data.error === "string") {
          toast.error(data.error);
        } else {
          toast.error("Failed to book appointment");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = (session: Session) => {
    const available = session.maxTokens - session.currentTokens;
    return Math.max(0, available);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            {(() => {
              // Logo from settings if available
              // We do a small fetch-once pattern by leveraging the already-loaded sessions (separate from SSR)
              // For simplicity here, we reference the logo path from window._hospitalLogo if available in future.
              return null;
            })()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book an Appointment
          </h1>
          <p className="text-gray-600">
            Schedule your visit with our healthcare professionals
          </p>
          <p className="text-sm text-gray-500 mt-2">
            By booking, you agree to our <a href="/terms" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div
                className={`flex items-center space-x-2 ${
                  step >= stepNumber ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  } ${step === stepNumber ? "ring-2 ring-blue-300" : ""}`}
                >
                  {stepNumber === 4 && step >= 4 ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {stepNumber === 1 && "Personal Info"}
                  {stepNumber === 2 && "Select Session"}
                  {stepNumber === 3 && "Review"}
                  {stepNumber === 4 && "Confirmation"}
                </span>
              </div>
              {stepNumber < 4 && <div className="w-8 h-px bg-gray-300"></div>}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Please provide your contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>Next</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Session */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Select Appointment Session
              </CardTitle>
              <CardDescription>
                Choose your preferred date and session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <HospitalDateInput
                value={selectedDate}
                onChange={setSelectedDate}
                label="Select Appointment Date"
                required={true}
                id="date"
              />

              {/* Problem Categories Selection */}
              <div className="space-y-2">
                <Label>Health Concerns *</Label>
                <ProblemCategoriesSelect
                  value={formData.problemCategories}
                  onChange={(categories) => {
                    handleInputChange("problemCategories", categories);
                    // Reload doctors when categories change
                    if (formData.sessionId) {
                      loadDoctorsForSession(formData.sessionId, categories);
                    }
                  }}
                  placeholder="Select your health concerns..."
                  required={true}
                  maxSelections={3}
                />
                <p className="text-xs text-gray-500">
                  Select up to 3 categories that best describe your health concerns. This helps us assign the most suitable doctor.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Available Sessions for {formatDate(selectedDate)}</Label>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No sessions available for this date
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => {
                      const availableSlots = getAvailableSlots(session);
                      const isSelected = formData.sessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                              : availableSlots > 0
                                ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          }`}
                          onClick={() => {
                            if (availableSlots > 0) {
                              handleInputChange("sessionId", session.id);
                              // Auto-load doctors for this session with current problem categories
                              loadDoctorsForSession(session.id, formData.problemCategories);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {session.name}
                            </h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {session.shortCode}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {session.startTime} - {session.endTime}
                            </div>
                            {session.doctor && (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                Dr. {session.doctor.name}
                              </div>
                            )}
                            <div
                              className={`font-medium ${
                                availableSlots > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {availableSlots > 0
                                ? `${availableSlots} slots available`
                                : "Session Full"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Appointment Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="FOLLOW_UP">Follow-up</option>
                    <option value="ROUTINE_CHECKUP">Routine Checkup</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
              </div>

              {/* Auto-assigned doctor display */}
              <div className="space-y-2">
                <Label>Assigned Doctor</Label>
                {/* Doctor field removed from public view as requested */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any specific concerns or requirements..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!formData.sessionId || formData.problemCategories.length === 0}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Appointment</CardTitle>
              <CardDescription>
                Please review your information before confirming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {formData.firstName} {formData.lastName}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {formData.phone}
                    </p>
                    {formData.email && (
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {formData.email}
                      </p>
                    )}
                    {formData.dateOfBirth && (
                      <p>
                        <span className="font-medium">Date of Birth:</span>{" "}
                        {formData.dateOfBirth}
                      </p>
                    )}
                    {formData.gender && (
                      <p>
                        <span className="font-medium">Gender:</span>{" "}
                        {formData.gender}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Appointment Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const selectedSession = sessions.find(
                        (s) => s.id === formData.sessionId,
                      );
                      return selectedSession ? (
                        <>
                          <p>
                            <span className="font-medium">Date:</span>{" "}
                            {formatDate(selectedDate)}
                          </p>
                          <p>
                            <span className="font-medium">Session:</span>{" "}
                            {selectedSession.name} ({selectedSession.shortCode})
                          </p>
                          <p>
                            <span className="font-medium">Time:</span>{" "}
                            {selectedSession.startTime} -{" "}
                            {selectedSession.endTime}
                          </p>
                          {selectedSession.doctor && (
                            <p>
                              <span className="font-medium">Doctor:</span> Dr.{" "}
                              {selectedSession.doctor.name}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Type:</span>{" "}
                            {formData.type}
                          </p>
                          <p>
                            <span className="font-medium">Priority:</span>{" "}
                            {formData.priority}
                          </p>
                          <div>
                            <span className="font-medium">Health Concerns:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                              {formData.problemCategories.map(categoryId => {
                                const category = getProblemCategory(categoryId);
                                return category ? (
                                  <span key={categoryId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    <span aria-hidden>{category.icon}</span>
                                    <span>{category.name}</span>
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          {formData.notes && (
                            <p>
                              <span className="font-medium">Notes:</span>{" "}
                              {formData.notes}
                            </p>
                          )}
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Information:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Please arrive 15 minutes before your session starts
                      </li>
                      <li>
                        Bring a valid ID and any relevant medical documents
                      </li>
                      <li>
                        You will receive a token number for queue management
                      </li>
                      <li>Contact us if you need to reschedule or cancel</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 border rounded bg-gray-50">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    className="mt-1"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    I have read and accept the
                    {" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Terms & Conditions
                    </a>
                    , including consent for processing of my personal and health data in accordance with applicable Indian laws.
                  </label>
                </div>
                <div className="flex justify-between pt-1">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading || !acceptedTerms}>
                    {loading ? "Booking..." : "Confirm Appointment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && bookingResult && (
          <Card ref={confirmationRef}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">
                Appointment Confirmed!
              </CardTitle>
              <CardDescription>
                Your appointment has been successfully booked
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                {/* Branding header for token */}
                <div className="flex items-center justify-center gap-3 mb-2 print:mb-1">
                  {hospitalSettings?.logo ? (
                    <img
                      src={hospitalSettings.logo}
                      alt="Hospital Logo"
                      className="w-10 h-10 object-contain rounded border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded overflow-hidden border flex items-center justify-center bg-blue-50 text-blue-700 font-bold">
                      {(hospitalSettings?.name || 'H').slice(0,1)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-base font-bold leading-tight">
                      {hospitalSettings?.name || 'Hospital'}
                    </div>
                    {hospitalSettings?.tagline && (
                      <div className="text-xs text-gray-600 leading-tight">{hospitalSettings.tagline}</div>
                    )}
                    {(hospitalSettings?.phone || hospitalSettings?.email || hospitalSettings?.address) && (
                      <div className="text-[11px] text-gray-500 leading-tight">
                        {hospitalSettings?.phone}
                        {hospitalSettings?.phone && hospitalSettings?.email ? ' • ' : ''}
                        {hospitalSettings?.email}
                        {hospitalSettings?.address ? ` • ${hospitalSettings.address}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-blue-700 mb-2 print:mb-1">
                  Token: {bookingResult.tokenNumber}
                </div>
                <p className="text-gray-600 text-sm print:text-xs">
                  Save your token. You can download it, take a photo, or print it now.
                </p>
                <div className="mt-3 text-xs text-gray-600 max-w-2xl mx-auto text-left bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="font-semibold text-yellow-800 mb-1">Disclaimer</p>
                  <p>
                    The token number is provided solely for queue management. It does not create a right to consultation,
                    nor does it guarantee that a consultation will occur at a specific time. Actual consultation is subject to
                    patient arrival and registration, clinical triage (including prioritisation of emergencies and critical cases),
                    the attending doctor’s availability, and operational considerations of the hospital. The hospital reserves the
                    right to re-sequence, delay, or cancel consultations when necessary in the interest of patient safety and
                    clinical urgency.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 print:mt-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const node = confirmationRef.current;
                        if (!node) return;
                        const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
                        const dataUrl = canvas.toDataURL('image/png');
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = `token-${bookingResult.tokenNumber}.png`;
                        a.click();
                      } catch (e) {
                        toast.error('Failed to download image');
                      }
                    }}
                  >
                    Download Token (PNG)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print:p-3">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Appointment Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(bookingResult.sessionInfo.date)}
                  </p>
                  <p>
                    <span className="font-medium">Session:</span>{" "}
                    {bookingResult.sessionInfo.name}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span>{" "}
                    {bookingResult.sessionInfo.startTime} -{" "}
                    {bookingResult.sessionInfo.endTime}
                  </p>
                  <p>
                    <span className="font-medium">Patient:</span>{" "}
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {formData.phone}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg print:p-3">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Next Steps:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>
                    Arrive at the hospital 15 minutes before your session time
                  </li>
                  <li>Present your token number at the reception</li>
                  <li>Wait for your token to be called</li>
                  <li>Bring valid ID and any medical documents</li>
                </ul>
              </div>

              <div className="text-center flex items-center justify-center gap-3 print:hidden">
                <Button onClick={() => window.location.reload()}>
                  Book Another Appointment
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = "/")}>Back to Landing Page</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* Print optimization to fit in one page */
/* eslint-disable @next/next/no-css-tags */
<style jsx global>{`
  @media print {
    @page { margin: 12mm; }
    html, body { height: auto !important; }
    .print\:mb-1 { margin-bottom: 0.25rem !important; }
    .print\:p-3 { padding: 0.75rem !important; }
    .print\:text-xs { font-size: 0.75rem !important; }
    .print\:mt-2 { margin-top: 0.5rem !important; }
  }
`}</style>

export default function PublicBookAppointment() {
  return (
    <Suspense fallback={<div className="p-6">Loading booking...</div>}>
      <BookingPageInner />
    </Suspense>
  );
}
