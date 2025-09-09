"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  Stethoscope,
  Pill,
  FileText,
  Activity,
  Clock,
  ChevronRight,
  Eye,
  Download,
  X,
  TestTube,
  Heart,
  Thermometer,
  Syringe,
  Microscope,
  Zap,
  Shield,
  UserCheck,
  Clipboard,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type:
    | "consultation"
    | "prescription"
    | "appointment"
    | "report"
    | "admission"
    | "lab_test"
    | "surgery"
    | "vaccination"
    | "emergency"
    | "follow_up";
  date: string;
  time?: string;
  title: string;
  doctor: {
    name: string;
    specialization?: string;
  };
  details: {
    symptoms?: string;
    diagnosis?: string;
    notes?: string;
    medicines?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    labTests?: Array<{
      name: string;
      instructions?: string;
      url?: string;
    }>;
    therapies?: Array<{
      name: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }>;
    reports?: Array<{
      name: string;
      type: string;
      url?: string;
    }>;
    vitals?: {
      bp?: string;
      pulse?: string;
      temperature?: string;
      weight?: string;
    };
  };
  status: "completed" | "pending" | "cancelled";
}

interface MedicalTimelineProps {
  patientId: string;
  onEventUpdate?: () => void;
}

export default function MedicalTimeline({
  patientId,
  onEventUpdate,
}: MedicalTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      fetchMedicalHistory();
    }
  }, [patientId]);

  const fetchMedicalHistory = async () => {
    try {
      const [consultations, prescriptions, appointments] = await Promise.all([
        fetch(`/api/consultations?patientId=${patientId}`)
          .then((r) => (r.ok ? r.json() : { consultations: [] }))
          .catch((err) => {
            console.error("Error fetching consultations:", err);
            return { consultations: [] };
          }),
        fetch(`/api/prescriptions?patientId=${patientId}`)
          .then((r) => (r.ok ? r.json() : { prescriptions: [] }))
          .catch((err) => {
            console.error("Error fetching prescriptions:", err);
            return { prescriptions: [] };
          }),
        fetch(`/api/appointments?patientId=${patientId}`)
          .then((r) => (r.ok ? r.json() : { appointments: [] }))
          .catch((err) => {
            console.error("Error fetching appointments:", err);
            return { appointments: [] };
          }),
      ]);

      const timelineEvents: TimelineEvent[] = [];

      // Add consultations
      consultations.consultations?.forEach((consultation: any) => {
        if (consultation && consultation.id) {
          timelineEvents.push({
            id: `consultation-${consultation.id}`,
            type: "consultation",
            date: consultation.createdAt || new Date().toISOString(),
            title: "Medical Consultation",
            doctor: {
              name:
                consultation.doctor?.name ||
                `Dr. ${consultation.doctor?.firstName || ""} ${consultation.doctor?.lastName || ""}`.trim() ||
                "Unknown Doctor",
              specialization: consultation.doctor?.specialization,
            },
            details: {
              symptoms: consultation.symptoms,
              diagnosis: consultation.diagnosis,
              notes: consultation.notes,
              vitals: consultation.vitals
                ? typeof consultation.vitals === "string"
                  ? JSON.parse(consultation.vitals)
                  : consultation.vitals
                : undefined,
            },
            status: "completed",
          });
        }
      });

      // Add prescriptions
      prescriptions.prescriptions?.forEach((prescription: any) => {
        if (prescription && prescription.id) {
          let medicines = [];
          try {
            medicines = prescription.medicines
              ? typeof prescription.medicines === "string"
                ? JSON.parse(prescription.medicines)
                : prescription.medicines
              : [];
          } catch (e) {
            medicines = [];
          }

          timelineEvents.push({
            id: `prescription-${prescription.id}`,
            type: "prescription",
            date: prescription.createdAt || new Date().toISOString(),
            title: "Prescription Issued",
            doctor: {
              name:
                prescription.doctor?.name ||
                `Dr. ${prescription.doctor?.firstName || ""} ${prescription.doctor?.lastName || ""}`.trim() ||
                "Unknown Doctor",
              specialization: prescription.doctor?.specialization,
            },
            details: {
              symptoms: prescription.symptoms,
              diagnosis: prescription.diagnosis,
              notes: prescription.notes,
              vitals: prescription.vitals
                ? typeof prescription.vitals === "string"
                  ? JSON.parse(prescription.vitals)
                  : prescription.vitals
                : undefined,
              medicines: medicines.medicines || medicines || [],
              labTests: medicines.labTests || [],
              therapies: medicines.therapies || [],
            },
            status: "completed",
          });
        }
      });

      // Add appointments
      appointments.appointments?.forEach((appointment: any) => {
        if (appointment && appointment.id) {
          timelineEvents.push({
            id: `appointment-${appointment.id}`,
            type: "appointment",
            date:
              appointment.dateTime ||
              appointment.date ||
              new Date().toISOString(),
            time: appointment.time,
            title: `${appointment.type?.replace("_", " ") || "Appointment"}`,
            doctor: {
              name:
                appointment.doctor?.name ||
                `Dr. ${appointment.doctor?.firstName || ""} ${appointment.doctor?.lastName || ""}`.trim() ||
                "Unknown Doctor",
              specialization: appointment.doctor?.specialization,
            },
            details: {
              notes: appointment.reason || appointment.notes,
            },
            status: (appointment.status?.toLowerCase() || "pending") as
              | "completed"
              | "pending"
              | "cancelled",
          });
        }
      });

      // Sort by date (newest first) with null safety
      timelineEvents.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB.getTime() - dateA.getTime();
      });
      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching medical history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "consultation":
        return <Stethoscope className="h-5 w-5" />;
      case "prescription":
        return <Pill className="h-5 w-5" />;
      case "appointment":
        return <Calendar className="h-5 w-5" />;
      case "report":
        return <FileText className="h-5 w-5" />;
      case "admission":
        return <Heart className="h-5 w-5" />;
      case "lab_test":
        return <TestTube className="h-5 w-5" />;
      case "surgery":
        return <Zap className="h-5 w-5" />;
      case "vaccination":
        return <Syringe className="h-5 w-5" />;
      case "emergency":
        return <Shield className="h-5 w-5" />;
      case "follow_up":
        return <UserCheck className="h-5 w-5" />;
      default:
        return <Clipboard className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === "cancelled")
      return "bg-red-500 border-red-600 text-white shadow-lg";
    if (status === "pending")
      return "bg-amber-500 border-amber-600 text-white shadow-lg";

    switch (type) {
      case "consultation":
        return "bg-blue-600 border-blue-700 text-white shadow-lg";
      case "prescription":
        return "bg-emerald-600 border-emerald-700 text-white shadow-lg";
      case "appointment":
        return "bg-indigo-600 border-indigo-700 text-white shadow-lg";
      case "report":
        return "bg-orange-600 border-orange-700 text-white shadow-lg";
      case "admission":
        return "bg-rose-600 border-rose-700 text-white shadow-lg";
      case "lab_test":
        return "bg-teal-600 border-teal-700 text-white shadow-lg";
      case "surgery":
        return "bg-red-600 border-red-700 text-white shadow-lg";
      case "vaccination":
        return "bg-green-600 border-green-700 text-white shadow-lg";
      case "emergency":
        return "bg-red-700 border-red-800 text-white shadow-lg";
      case "follow_up":
        return "bg-purple-600 border-purple-700 text-white shadow-lg";
      default:
        return "bg-slate-600 border-slate-700 text-white shadow-lg";
    }
  };

  const getBorderColor = (type: string, status: string) => {
    if (status === "cancelled") return "border-l-red-500";
    if (status === "pending") return "border-l-amber-500";

    switch (type) {
      case "consultation":
        return "border-l-blue-600";
      case "prescription":
        return "border-l-emerald-600";
      case "appointment":
        return "border-l-indigo-600";
      case "report":
        return "border-l-orange-600";
      case "admission":
        return "border-l-rose-600";
      case "lab_test":
        return "border-l-teal-600";
      case "surgery":
        return "border-l-red-600";
      case "vaccination":
        return "border-l-green-600";
      case "emergency":
        return "border-l-red-700";
      case "follow_up":
        return "border-l-purple-600";
      default:
        return "border-l-slate-600";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medical Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Medical Timeline
          </CardTitle>
          <CardDescription>
            Complete medical history and encounters for this patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical history available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Professional Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300"></div>

              {/* Timeline Events */}
              <div className="space-y-8">
                {events.map((event, index) => (
                  <div
                    key={event.id}
                    className="relative flex items-start space-x-6 group"
                    onMouseEnter={() => setHoveredEvent(event.id)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {/* Professional Timeline Node */}
                    <div
                      className={`
                      relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white
                      ${getEventColor(event.type, event.status)}
                      transition-all duration-200 ease-in-out
                      ${hoveredEvent === event.id ? "scale-110" : "scale-100"}
                      shadow-xl
                    `}
                    >
                      <div className="relative z-10">
                        {getEventIcon(event.type)}
                      </div>
                    </div>

                    {/* Professional Event Card */}
                    <div className="flex-1 min-w-0">
                      <Card
                        className={`
                        transition-all duration-200 cursor-pointer
                        ${hoveredEvent === event.id ? "shadow-xl border-slate-300" : "shadow-md border-slate-200"}
                        border-l-4 ${getBorderColor(event.type, event.status)}
                        bg-white hover:bg-slate-50
                      `}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {event.title}
                                </h3>
                                {getStatusBadge(event.status)}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(event.date)}
                                </span>
                                {event.time && (
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {formatTime(event.time)}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  {event.doctor.name}
                                </span>
                              </div>

                              {/* Comprehensive SOAP & Prescription Preview */}
                              <div className="text-sm text-gray-700 space-y-2">
                                {/* SOAP Notes Section */}
                                {event.details.symptoms && (
                                  <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                    <p>
                                      <strong className="text-blue-700">
                                        S (Subjective):
                                      </strong>{" "}
                                      {event.details.symptoms.length > 80
                                        ? event.details.symptoms.substring(
                                            0,
                                            80,
                                          ) + "..."
                                        : event.details.symptoms}
                                    </p>
                                  </div>
                                )}

                                {event.details.vitals &&
                                  Object.keys(event.details.vitals).length >
                                    0 && (
                                    <div className="bg-green-50 p-2 rounded border-l-2 border-green-300">
                                      <p>
                                        <strong className="text-green-700">
                                          O (Objective):
                                        </strong>
                                        {event.details.vitals.bp &&
                                          ` BP: ${event.details.vitals.bp}`}
                                        {event.details.vitals.pulse &&
                                          ` | Pulse: ${event.details.vitals.pulse}`}
                                        {event.details.vitals.temperature &&
                                          ` | Temp: ${event.details.vitals.temperature}°F`}
                                        {event.details.vitals.weight &&
                                          ` | Weight: ${event.details.vitals.weight}kg`}
                                      </p>
                                    </div>
                                  )}

                                {event.details.diagnosis && (
                                  <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                                    <p>
                                      <strong className="text-orange-700">
                                        A (Assessment):
                                      </strong>{" "}
                                      {event.details.diagnosis.length > 80
                                        ? event.details.diagnosis.substring(
                                            0,
                                            80,
                                          ) + "..."
                                        : event.details.diagnosis}
                                    </p>
                                  </div>
                                )}

                                {/* Prescription Summary */}
                                {event.details.medicines &&
                                  event.details.medicines.length > 0 && (
                                    <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                                      <p>
                                        <strong className="text-purple-700">
                                          P (Plan) - Medications:
                                        </strong>
                                      </p>
                                      <div className="ml-2 mt-1 space-y-1">
                                        {event.details.medicines
                                          .slice(0, 3)
                                          .map((med: any, idx: number) => (
                                            <div key={idx} className="text-xs">
                                              • <strong>{med.name}</strong> -{" "}
                                              {med.dosage} ({med.frequency}) for{" "}
                                              {med.duration}
                                            </div>
                                          ))}
                                        {event.details.medicines.length > 3 && (
                                          <div className="text-xs text-purple-600">
                                            +{" "}
                                            {event.details.medicines.length - 3}{" "}
                                            more medications
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {event.details.notes && (
                                  <div className="bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                    <p>
                                      <strong className="text-gray-700">
                                        Additional Notes:
                                      </strong>{" "}
                                      {event.details.notes.length > 100
                                        ? event.details.notes.substring(
                                            0,
                                            100,
                                          ) + "..."
                                        : event.details.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Event Type Badge */}
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex space-x-2">
                                    {event.type === "consultation" && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Stethoscope className="w-3 h-3 mr-1" />
                                        Consultation
                                      </span>
                                    )}
                                    {event.type === "prescription" && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <Pill className="w-3 h-3 mr-1" />
                                        Prescription
                                      </span>
                                    )}
                                    {event.type === "appointment" && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Appointment
                                      </span>
                                    )}
                                  </div>
                                  {(event.details.medicines?.length || 0) >
                                    0 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {event.details.medicines?.length} Rx
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                              className="ml-4"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact Professional Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100">
            <div className="p-6">
              {/* Header with Event Icon and Type */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div
                    className={`
                    flex items-center justify-center w-12 h-12 rounded-full
                    ${getEventColor(selectedEvent.type, selectedEvent.status)}
                  `}
                  >
                    {getEventIcon(selectedEvent.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedEvent.title}
                    </h2>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(selectedEvent.date)}
                      </span>
                      {selectedEvent.time && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(selectedEvent.time)}
                        </span>
                      )}
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {selectedEvent.doctor.name}
                      </span>
                      {getStatusBadge(selectedEvent.status)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Compact SOAP Notes Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* SOAP Notes Column */}
                <div className="space-y-4">
                  {/* Subjective */}
                  {selectedEvent.details.symptoms && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                          S
                        </div>
                        <h3 className="font-semibold text-blue-800">
                          Subjective
                        </h3>
                      </div>
                      <p className="text-blue-900 text-sm leading-relaxed">
                        {selectedEvent.details.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Objective */}
                  {selectedEvent.details.vitals &&
                    Object.keys(selectedEvent.details.vitals).length > 0 && (
                      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                            O
                          </div>
                          <h3 className="font-semibold text-green-800">
                            Objective - Vitals
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {selectedEvent.details.vitals.bp && (
                            <div className="flex items-center">
                              <Heart className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-green-900">
                                <strong>BP:</strong>{" "}
                                {selectedEvent.details.vitals.bp}
                              </span>
                            </div>
                          )}
                          {selectedEvent.details.vitals.pulse && (
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-green-900">
                                <strong>Pulse:</strong>{" "}
                                {selectedEvent.details.vitals.pulse} bpm
                              </span>
                            </div>
                          )}
                          {selectedEvent.details.vitals.temperature && (
                            <div className="flex items-center">
                              <Thermometer className="h-4 w-4 text-orange-500 mr-2" />
                              <span className="text-green-900">
                                <strong>Temp:</strong>{" "}
                                {selectedEvent.details.vitals.temperature}°F
                              </span>
                            </div>
                          )}
                          {selectedEvent.details.vitals.weight && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-purple-500 mr-2" />
                              <span className="text-green-900">
                                <strong>Weight:</strong>{" "}
                                {selectedEvent.details.vitals.weight} kg
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Assessment */}
                  {selectedEvent.details.diagnosis && (
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                          A
                        </div>
                        <h3 className="font-semibold text-orange-800">
                          Assessment
                        </h3>
                      </div>
                      <p className="text-orange-900 text-sm leading-relaxed">
                        {selectedEvent.details.diagnosis}
                      </p>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedEvent.details.notes && (
                    <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <Clipboard className="h-5 w-5 text-gray-600 mr-2" />
                        <h3 className="font-semibold text-gray-800">
                          Clinical Notes
                        </h3>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {selectedEvent.details.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Plan & Prescriptions Column */}
                <div className="space-y-4">
                  {/* Plan - Medications */}
                  {selectedEvent.details.medicines &&
                    selectedEvent.details.medicines.length > 0 && (
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-2">
                            P
                          </div>
                          <h3 className="font-semibold text-purple-800">
                            Plan - Medications
                          </h3>
                          <span className="ml-auto bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {selectedEvent.details.medicines.length} Rx
                          </span>
                        </div>
                        <div className="space-y-3">
                          {selectedEvent.details.medicines.map(
                            (medicine, index) => (
                              <div
                                key={index}
                                className="bg-white border border-purple-200 rounded-lg p-3"
                              >
                                <div className="flex items-center mb-2">
                                  <Pill className="h-4 w-4 text-purple-600 mr-2" />
                                  <h4 className="font-semibold text-purple-900">
                                    {medicine.name}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="bg-purple-100 p-2 rounded">
                                    <span className="text-purple-700 font-medium">
                                      Dosage
                                    </span>
                                    <p className="text-purple-900">
                                      {medicine.dosage}
                                    </p>
                                  </div>
                                  <div className="bg-purple-100 p-2 rounded">
                                    <span className="text-purple-700 font-medium">
                                      Frequency
                                    </span>
                                    <p className="text-purple-900">
                                      {medicine.frequency}
                                    </p>
                                  </div>
                                  <div className="bg-purple-100 p-2 rounded">
                                    <span className="text-purple-700 font-medium">
                                      Duration
                                    </span>
                                    <p className="text-purple-900">
                                      {medicine.duration}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Lab Tests/Reports */}
                  {selectedEvent.details.labTests &&
                    selectedEvent.details.labTests.length > 0 && (
                      <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-r-lg">
                        <div className="flex items-center mb-3">
                          <TestTube className="h-5 w-5 text-teal-600 mr-2" />
                          <h3 className="font-semibold text-teal-800">
                            Lab Tests & Reports
                          </h3>
                          <span className="ml-auto bg-teal-200 text-teal-800 text-xs px-2 py-1 rounded-full">
                            {selectedEvent.details.labTests.length} Tests
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedEvent.details.labTests.map((test, index) => (
                            <div
                              key={index}
                              className="bg-white border border-teal-200 rounded-lg p-3 flex items-center justify-between"
                            >
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 text-teal-600 mr-2" />
                                <div>
                                  <p className="font-medium text-teal-900">
                                    {test.name}
                                  </p>
                                  <p className="text-xs text-teal-700">
                                    {test.instructions}
                                  </p>
                                </div>
                              </div>
                              {test.url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-teal-600 border-teal-300"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Therapies */}
                  {selectedEvent.details.therapies &&
                    selectedEvent.details.therapies.length > 0 && (
                      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                        <div className="flex items-center mb-3">
                          <Plus className="h-5 w-5 text-indigo-600 mr-2" />
                          <h3 className="font-semibold text-indigo-800">
                            Therapies
                          </h3>
                          <span className="ml-auto bg-indigo-200 text-indigo-800 text-xs px-2 py-1 rounded-full">
                            {selectedEvent.details.therapies.length} Therapies
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedEvent.details.therapies.map(
                            (therapy: any, index: number) => (
                              <div
                                key={index}
                                className="bg-white border border-indigo-200 rounded-lg p-3"
                              >
                                <div className="flex items-center mb-2">
                                  <Heart className="h-4 w-4 text-indigo-600 mr-2" />
                                  <h4 className="font-semibold text-indigo-900">
                                    {therapy.name}
                                  </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-indigo-100 p-2 rounded">
                                    <span className="text-indigo-700 font-medium">
                                      Frequency
                                    </span>
                                    <p className="text-indigo-900">
                                      {therapy.frequency}
                                    </p>
                                  </div>
                                  <div className="bg-indigo-100 p-2 rounded">
                                    <span className="text-indigo-700 font-medium">
                                      Duration
                                    </span>
                                    <p className="text-indigo-900">
                                      {therapy.duration}
                                    </p>
                                  </div>
                                </div>
                                {therapy.instructions && (
                                  <div className="mt-2 p-2 bg-indigo-50 rounded text-xs">
                                    <span className="text-indigo-700 font-medium">
                                      Instructions:
                                    </span>
                                    <p className="text-indigo-800">
                                      {therapy.instructions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Event Type Specific Info */}
                  {selectedEvent.type === "surgery" && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <Zap className="h-5 w-5 text-red-600 mr-2" />
                        <h3 className="font-semibold text-red-800">
                          Surgical Procedure
                        </h3>
                      </div>
                      <p className="text-red-900 text-sm">
                        Surgical intervention completed successfully
                      </p>
                    </div>
                  )}

                  {selectedEvent.type === "vaccination" && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <Syringe className="h-5 w-5 text-green-600 mr-2" />
                        <h3 className="font-semibold text-green-800">
                          Vaccination
                        </h3>
                      </div>
                      <p className="text-green-900 text-sm">
                        Vaccination administered as per schedule
                      </p>
                    </div>
                  )}

                  {selectedEvent.type === "emergency" && (
                    <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded-r-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-red-700 mr-2" />
                        <h3 className="font-semibold text-red-800">
                          Emergency Care
                        </h3>
                      </div>
                      <p className="text-red-900 text-sm">
                        Emergency medical attention provided
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
