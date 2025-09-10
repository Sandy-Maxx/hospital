"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  FileText,
  Search,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  Stethoscope,
  Phone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
const PatientChartModal = dynamic(
  () => import("@/components/charts/patient-chart-modal"),
  { ssr: false },
);
const PrescriptionForm = dynamic(
  () => import("@/components/prescriptions/prescription-form"),
  { ssr: false },
);
const MedicalTimeline = dynamic(
  () => import("@/components/timeline/medical-timeline"),
  { ssr: false },
);
import toast from "react-hot-toast";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: string;
}

interface Appointment {
  id: string;
  patient: Patient;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  notes?: string;
}

interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  symptoms: string;
  diagnosis: string;
  notes: string;
  createdAt: string;
  patient: Patient;
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPatientChart, setShowPatientChart] = useState(false);
  const [showRevenueChart, setShowRevenueChart] = useState(false);
  const [weeklyPatientCount, setWeeklyPatientCount] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Consultation form state
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchAppointments();
    fetchConsultations();
  }, []);

  useEffect(() => {
    calculateWeeklyPatientCount();
    calculateWeeklyRevenue();
  }, [appointments]);

  const calculateWeeklyPatientCount = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyCount = appointments.filter(
      (apt) =>
        new Date(apt.createdAt) >= oneWeekAgo && apt.status === "COMPLETED",
    ).length;

    setWeeklyPatientCount(weeklyCount);
  };

  const calculateWeeklyRevenue = async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const response = await fetch(
        `/api/bills?startDate=${oneWeekAgo.toISOString()}&doctorId=${session?.user?.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        const totalRevenue =
          data.bills?.reduce(
            (sum: number, bill: any) => sum + bill.totalAmount,
            0,
          ) || 0;
        setWeeklyRevenue(totalRevenue);
      }
    } catch (error) {
      console.error("Error calculating weekly revenue:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/appointments?date=${today}&status=SCHEDULED,ARRIVED,WAITING,IN_CONSULTATION`,
      );
      if (response.ok) {
        const data = await response.json();
        // dev-only log: doctor dashboard appointments
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await fetch("/api/consultations");
      if (response.ok) {
        const data = await response.json();
        setConsultations(data.consultations || []);
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const startConsultation = async (
    appointmentId: string,
    patientId: string,
  ) => {

    // Redirect to queue management page
    router.push("/queue");
    return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_CONSULTATION" }),
      });

      // dev-only log: response status

      if (response.ok) {
        // Refresh appointments to show updated status
        fetchAppointments();

        toast.success("Starting consultation...");

        // Immediate navigation without delay
        const url = `/prescriptions?patientId=${patientId}&appointmentId=${appointmentId}&consultation=true`;
        // dev-only log: navigating to

        // Force navigation using window.location for reliability
        window.location.href = url;
      } else {
        const errorData = await response.json();
        console.error("API error:", errorData);
        toast.error("Failed to start consultation");
      }
    } catch (error) {
      console.error("Error starting consultation:", error);
      toast.error("Something went wrong");
    }
  };

  const completeConsultation = async (appointmentId: string) => {
    if (!symptoms || !diagnosis) {
      toast.error("Please fill in symptoms and diagnosis");
      return;
    }

    try {
      // Create consultation record
      const consultationResponse = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          symptoms,
          diagnosis,
          notes,
        }),
      });

      if (consultationResponse.ok) {
        // Update appointment status
        const appointmentResponse = await fetch(
          `/api/appointments/${appointmentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Completed" }),
          },
        );

        if (appointmentResponse.ok) {
          toast.success("Consultation completed successfully");
          setSymptoms("");
          setDiagnosis("");
          setNotes("");
          setSelectedPatient(null);
          fetchAppointments();
          fetchConsultations();
        }
      }
    } catch (error) {
      toast.error("Failed to complete consultation");
    }
  };

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient.phone.includes(searchTerm),
  );

  const todayAppointments = filteredAppointments.filter((apt) => {
    const today = new Date().toISOString().split("T")[0];
    return apt.appointmentDate === today;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, Dr. {session?.user?.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Appointments
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    appointments.filter((apt) => apt.status === "Waiting")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  In Consultation
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    appointments.filter(
                      (apt) => apt.status === "In Consultation",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowPatientChart(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Patients (This Week)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {weeklyPatientCount}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Click to view chart</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowRevenueChart(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Weekly Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{weeklyRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Click to view chart</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "appointments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Today's Queue
          </button>
          <button
            onClick={() => setActiveTab("consultations")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "consultations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Recent Consultations
          </button>
        </nav>
      </div>

      {activeTab === "appointments" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Appointments Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Queue</CardTitle>
                <CardDescription>
                  Patients waiting for consultation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAppointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No appointments found
                    </p>
                  ) : (
                    filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPatient?.id === appointment.patient.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedPatient(appointment.patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {appointment.patient.firstName}{" "}
                              {appointment.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {appointment.patient.age} years,{" "}
                              {appointment.patient.gender}
                            </p>
                            <p className="text-sm text-gray-600">
                              {appointment.patient.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                appointment.status === "Waiting"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : appointment.status === "In Consultation"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {appointment.status}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {appointment.appointmentTime}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          {appointment.status === "Waiting" && (
                            <Button
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                console.log(
                                  "Button clicked, appointment:",
                                  appointment,
                                );
                                await startConsultation(
                                  appointment.id,
                                  appointment.patient.id,
                                );
                              }}
                            >
                              Start Consultation
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Consultation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Consultation</CardTitle>
                <CardDescription>
                  {selectedPatient
                    ? `Consulting: ${selectedPatient.firstName} ${selectedPatient.lastName}`
                    : "Select a patient to start consultation"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="symptoms">Symptoms</Label>
                      <textarea
                        id="symptoms"
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={3}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Describe patient symptoms..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="diagnosis">Diagnosis</Label>
                      <textarea
                        id="diagnosis"
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={3}
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="Enter diagnosis..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <textarea
                        id="notes"
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    {/* Medical Timeline */}
                    <div className="mt-6">
                      <MedicalTimeline
                        patientId={selectedPatient.id}
                        onEventUpdate={() => {
                          // Refresh data when timeline updates
                          fetchAppointments();
                          fetchConsultations();
                        }}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          const appointment = appointments.find(
                            (apt) => apt.patient.id === selectedPatient.id,
                          );
                          if (appointment) {
                            completeConsultation(appointment.id);
                          }
                        }}
                        className="flex-1"
                      >
                        Complete Consultation
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPatient(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a patient from the queue to start consultation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "consultations" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Consultations</CardTitle>
            <CardDescription>Your recent patient consultations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No consultations found
                </p>
              ) : (
                consultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {consultation.patient.firstName}{" "}
                        {consultation.patient.lastName}
                      </h3>
                      <span className="text-sm text-gray-600">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Symptoms:
                        </span>
                        <p className="text-gray-600">{consultation.symptoms}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Diagnosis:
                        </span>
                        <p className="text-gray-600">
                          {consultation.diagnosis}
                        </p>
                      </div>
                      {consultation.notes && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Notes:
                          </span>
                          <p className="text-gray-600">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Modals */}
      {showPatientChart && (
        <PatientChartModal
          isOpen={showPatientChart}
          onClose={() => setShowPatientChart(false)}
          weeklyCount={weeklyPatientCount}
          appointments={appointments}
        />
      )}

      {showRevenueChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                  Revenue Analytics
                </h2>
                <p className="text-gray-600 mt-1">
                  Track your consultation revenue trends
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRevenueChart(false)}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Weekly Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{weeklyRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">
                        Avg per Patient
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹
                        {weeklyPatientCount > 0
                          ? Math.round(
                              weeklyRevenue / weeklyPatientCount,
                            ).toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                Revenue Summary
              </h3>
              <p className="text-green-800 text-sm">
                You have generated{" "}
                <strong>₹{weeklyRevenue.toLocaleString()}</strong> in revenue
                this week from <strong>{weeklyPatientCount}</strong> completed
                consultations.
                {weeklyPatientCount > 0 && (
                  <>
                    {" "}
                    Your average consultation value is{" "}
                    <strong>
                      ₹
                      {Math.round(
                        weeklyRevenue / weeklyPatientCount,
                      ).toLocaleString()}
                    </strong>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
