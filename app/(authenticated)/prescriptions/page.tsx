"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pill,
  Search,
  FileText,
  Calendar,
  User,
  Plus,
  Stethoscope,
  ClipboardList,
  Activity,
} from "lucide-react";
import dynamic from "next/dynamic";
const PrescriptionForm = dynamic(
  () => import("@/components/prescriptions/prescription-form"),
  { ssr: false },
);
const ConsultationNotes = dynamic(
  () => import("@/components/soap/consultation-notes"),
  { ssr: false },
);
const PrescriptionViewModal = dynamic(
  () => import("@/components/prescriptions/prescription-view-modal"),
  { ssr: false },
);
import { formatDateTime } from "@/lib/utils";
import toast from "react-hot-toast";
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: string;
}

interface Prescription {
  id: string;
  patient: Patient;
  doctor: {
    id: string;
    name: string;
  };
  medicines: string;
  createdAt: string;
  consultation?: {
    id: string;
    symptoms: string;
    diagnosis: string;
    appointmentId?: string;
  };
}

export default function PrescriptionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [viewOpen, setViewOpen] = useState<{ [id: string]: boolean }>({});
  const [editing, setEditing] = useState<{
    id: string | null;
    data: any | null;
  }>({ id: null, data: null });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [consultationMode, setConsultationMode] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [soapNotes, setSoapNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });
  const [quickNotes, setQuickNotes] = useState({
    commonSymptoms: [] as string[],
    vitalSigns: {
      temperature: "",
      bloodPressure: "",
      pulse: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    },
    commonDiagnoses: [] as string[],
  });
  const [soapFilledBy, setSoapFilledBy] = useState<{
    name?: string;
    at?: string;
    role?: string;
    id?: string;
  } | null>(null);
  const [soapEditedBy, setSoapEditedBy] = useState<
    Array<{ name?: string; at?: string; role?: string; id?: string }>
  >([]);

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, []);

  useEffect(() => {
    // Check if coming from consultation
    const patientId = searchParams.get("patientId");
    const appointmentIdParam = searchParams.get("appointmentId");
    const consultation = searchParams.get("consultation");

    console.log("URL Params:", { patientId, appointmentIdParam, consultation });
    console.log("Current URL:", window.location.href);

    if (patientId && consultation === "true") {
      console.log("Setting consultation mode");
      setConsultationMode(true);
      setAppointmentId(appointmentIdParam);
      setShowNewPrescription(true);

      // Always fetch patient directly for consultation mode
      fetchPatientById(patientId);
    }
  }, [searchParams]);

  // Prefill SOAP/QuickNotes from appointment.notes when in consultation mode
  useEffect(() => {
    if (
      (consultationMode && appointmentId) ||
      (editing.id && editing.data?.consultation?.appointmentId)
    ) {
      const targetAppointmentId =
        appointmentId || editing.data?.consultation?.appointmentId;
      console.log("Loading SOAP data for appointment:", targetAppointmentId);

      fetch(`/api/appointments/${targetAppointmentId}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          try {
            const rawNotes = data?.appointment?.notes;
            if (rawNotes) {
              const parsed = JSON.parse(rawNotes);
              console.log("Loaded SOAP notes:", parsed);

              if (parsed?.soapNotes) {
                setSoapNotes({
                  subjective: parsed.soapNotes.subjective || "",
                  objective: parsed.soapNotes.objective || "",
                  assessment: parsed.soapNotes.assessment || "",
                  plan: parsed.soapNotes.plan || "",
                });
              }
              if (parsed?.quickNotes) {
                setQuickNotes({
                  commonSymptoms: parsed.quickNotes.commonSymptoms || [],
                  vitalSigns: {
                    temperature:
                      parsed.quickNotes.vitalSigns?.temperature || "",
                    bloodPressure:
                      parsed.quickNotes.vitalSigns?.bloodPressure || "",
                    pulse: parsed.quickNotes.vitalSigns?.pulse || "",
                    respiratoryRate:
                      parsed.quickNotes.vitalSigns?.respiratoryRate || "",
                    oxygenSaturation:
                      parsed.quickNotes.vitalSigns?.oxygenSaturation || "",
                  },
                  commonDiagnoses: parsed.quickNotes.commonDiagnoses || [],
                });
              }
              if (parsed?.filledBy) {
                setSoapFilledBy({
                  name: parsed.filledBy.name,
                  at: parsed.filledBy.at,
                  role: parsed.filledBy.role,
                  id: parsed.filledBy.id,
                });
              }
              if (Array.isArray(parsed?.editedBy)) {
                setSoapEditedBy(
                  parsed.editedBy.map((e: any) => ({
                    name: e.name,
                    at: e.at,
                    role: e.role,
                    id: e.id,
                  })),
                );
              } else {
                setSoapEditedBy([]);
              }
            }
          } catch (error) {
            console.error("Error parsing appointment notes:", error);
          }
        }
      });
    }
  }, [consultationMode, appointmentId, editing.id]);

  // Separate effect to handle patient selection when patients list changes
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    const consultation = searchParams.get("consultation");

    if (
      patientId &&
      consultation === "true" &&
      patients.length > 0 &&
      !selectedPatient
    ) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        console.log("Auto-selecting patient from list:", patient);
        setSelectedPatient(patient);
      }
    }

    // Handle edit by id from URL
    const editId = searchParams.get("editId");
    if (editId && !editing.id) {
      console.log("Loading prescription for edit:", editId);
      // Load the prescription and open edit form
      fetch(`/api/prescriptions/${editId}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const pres = data.prescription;
          console.log("Loaded prescription for edit:", pres);
          setShowNewPrescription(true);
          setSelectedPatient(pres.patient);
          setEditing({ id: pres.id, data: pres });
          // Also enable consultation mode to show SOAP and load appointment notes if present
          if (pres.consultation?.appointmentId) {
            console.log(
              "Setting consultation mode for edit with appointment:",
              pres.consultation.appointmentId,
            );
            setConsultationMode(true);
            setAppointmentId(pres.consultation.appointmentId);
          } else {
            // No appointment link: prefill SOAP and quick notes from the prescription itself
            try {
              const medsJson = pres.medicines
                ? typeof pres.medicines === "string"
                  ? JSON.parse(pres.medicines)
                  : pres.medicines
                : {};
              const soapFromJson = medsJson?.soapNotes || {};
              setSoapNotes({
                subjective: soapFromJson.subjective ?? pres.symptoms ?? "",
                objective: soapFromJson.objective ?? "",
                assessment: soapFromJson.assessment ?? pres.diagnosis ?? "",
                plan: soapFromJson.plan ?? pres.notes ?? "",
              });
              const parsedVitals = pres.vitals
                ? typeof pres.vitals === "string"
                  ? JSON.parse(pres.vitals)
                  : pres.vitals
                : undefined;
              setQuickNotes({
                commonSymptoms: medsJson?.quickNotes?.commonSymptoms || [],
                vitalSigns: {
                  temperature:
                    parsedVitals?.temperature ||
                    medsJson?.quickNotes?.vitalSigns?.temperature ||
                    "",
                  bloodPressure:
                    parsedVitals?.bloodPressure ||
                    medsJson?.quickNotes?.vitalSigns?.bloodPressure ||
                    "",
                  pulse:
                    parsedVitals?.pulse ||
                    medsJson?.quickNotes?.vitalSigns?.pulse ||
                    "",
                  respiratoryRate:
                    parsedVitals?.respiratoryRate ||
                    medsJson?.quickNotes?.vitalSigns?.respiratoryRate ||
                    "",
                  oxygenSaturation:
                    parsedVitals?.oxygenSaturation ||
                    medsJson?.quickNotes?.vitalSigns?.oxygenSaturation ||
                    "",
                },
                commonDiagnoses: medsJson?.quickNotes?.commonDiagnoses || [],
              });
            } catch (e) {
              console.error(
                "Error parsing prescription payload for quick notes:",
                e,
              );
            }
          }
        }
      });
    }
  }, [patients, searchParams, selectedPatient]);

  const fetchPatientById = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched patient directly:", data.patient);
        setSelectedPatient(data.patient);
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/prescriptions");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrescriptionSuccess = () => {
    setShowNewPrescription(false);
    setSelectedPatient(null);
    setConsultationMode(false);
    setAppointmentId(null);
    setEditing({ id: null, data: null });
    setSoapNotes({
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
    });
    setQuickNotes({
      commonSymptoms: [],
      vitalSigns: {
        temperature: "",
        bloodPressure: "",
        pulse: "",
        respiratoryRate: "",
        oxygenSaturation: "",
      },
      commonDiagnoses: [],
    });
    setSoapFilledBy(null);
    setSoapEditedBy([]);
    fetchPrescriptions();
    toast.success("Prescription saved successfully");

    // Clear URL params
    router.replace("/prescriptions");
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm),
  );

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patient &&
      (prescription.patient.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        prescription.patient.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prescription.patient.phone.includes(searchTerm)),
  );

  const parseMedicines = (medicinesJson: string) => {
    try {
      return JSON.parse(medicinesJson);
    } catch {
      return [];
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600">
            Manage patient prescriptions and medications
          </p>
        </div>
        <Button
          onClick={() => setShowNewPrescription(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={session?.user?.role === "NURSE"}
          title={
            session?.user?.role === "NURSE"
              ? "Nurses cannot create prescriptions"
              : ""
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          {consultationMode ? "Complete Consultation" : "New Prescription"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Pill className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Prescriptions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {prescriptions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Prescriptions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    prescriptions.filter((p) => {
                      const today = new Date().toISOString().split("T")[0];
                      return p.createdAt.split("T")[0] === today;
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Patients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showNewPrescription && (
        <div className="space-y-6">
          {!selectedPatient ? (
            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
                <CardDescription>
                  Choose a patient to create a prescription for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <h3 className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.age} years, {patient.gender}
                        </p>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewPrescription(false);
                        setSearchTerm("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {selectedPatient && showNewPrescription && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Stethoscope className="w-5 h-5 mr-2" />
                          Consultation Notes
                        </CardTitle>
                        <CardDescription>
                          SOAP notes and clinical observations for{" "}
                          {selectedPatient?.firstName}{" "}
                          {selectedPatient?.lastName}
                        </CardDescription>
                      </div>
                      <div className="text-xs text-gray-500 text-right">
                        <div>
                          Filled by{" "}
                          {soapFilledBy?.name ||
                            soapFilledBy?.role ||
                            soapFilledBy?.id ||
                            "—"}
                          {soapFilledBy?.at
                            ? ` on ${formatDateTime(soapFilledBy.at)}`
                            : ""}
                        </div>
                        <div>
                          Edited by{" "}
                          {soapEditedBy && soapEditedBy.length > 0
                            ? soapEditedBy
                                .map(
                                  (e) =>
                                    `${e.name || e.role || e.id || "—"}${e.at ? ` on ${formatDateTime(e.at)}` : ""}`,
                                )
                                .join(", ")
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ConsultationNotes
                      soapNotes={soapNotes}
                      quickNotes={quickNotes}
                      onChangeSoap={setSoapNotes}
                      onChangeQuick={setQuickNotes}
                      disabled={
                        editing.id &&
                        editing.data &&
                        JSON.parse(editing.data.medicines || "{}")?.status ===
                          "COMPLETED"
                      }
                    />
                  </CardContent>
                </Card>
              )}

              {session?.user?.role !== "NURSE" ? (
                <PrescriptionForm
                  selectedPatient={selectedPatient}
                  onSuccess={handlePrescriptionSuccess}
                  onCancel={() => setShowNewPrescription(false)}
                  consultationData={{
                    soapNotes,
                    quickNotes,
                    appointmentId,
                  }}
                  existing={editing.id ? editing.data : undefined}
                />
              ) : (
                <div className="flex justify-end">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      if (!appointmentId || !selectedPatient?.id) return;
                      try {
                        const res = await fetch(
                          `/api/appointments/${appointmentId}/soap`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ soapNotes, quickNotes }),
                          },
                        );
                        if (res.ok) {
                          toast.success("SOAP saved");
                        } else {
                          const err = await res.json();
                          toast.error(err.error || "Failed to save SOAP");
                        }
                      } catch {
                        toast.error("Failed to save SOAP");
                      }
                    }}
                  >
                    Save SOAP
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!showNewPrescription && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>
              View and manage patient prescriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search prescriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-4">
                {filteredPrescriptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No prescriptions found</p>
                  </div>
                ) : (
                  filteredPrescriptions.map((prescription) => {
                    const medicines = parseMedicines(prescription.medicines);
                    const medicinesArray = Array.isArray(medicines)
                      ? medicines
                      : [];
                    const isCompleted =
                      medicines &&
                      typeof medicines === "object" &&
                      medicines.status === "COMPLETED";
                    return (
                      <div
                        key={prescription.id}
                        className="p-6 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {prescription.patient.firstName}{" "}
                              {prescription.patient.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {prescription.patient.age} years,{" "}
                              {prescription.patient.gender} •{" "}
                              {prescription.patient.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {prescription.doctor.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(
                                prescription.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {prescription.consultation && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700">
                              Consultation Notes:
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms:</span>{" "}
                              {prescription.consultation.symptoms}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Diagnosis:</span>{" "}
                              {prescription.consultation.diagnosis}
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Prescribed Medicines:
                          </h4>
                          {medicinesArray.map(
                            (medicine: any, index: number) => (
                              <div
                                key={index}
                                className="p-3 bg-blue-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-blue-900">
                                    {medicine.name}
                                  </h5>
                                  <span className="text-sm text-blue-700">
                                    {medicine.dosage}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-blue-700">
                                  <span className="font-medium">
                                    Frequency:
                                  </span>{" "}
                                  {medicine.frequency} •
                                  <span className="font-medium ml-2">
                                    Duration:
                                  </span>{" "}
                                  {medicine.duration}
                                </div>
                                {medicine.instructions && (
                                  <p className="mt-1 text-sm text-blue-600">
                                    <span className="font-medium">
                                      Instructions:
                                    </span>{" "}
                                    {medicine.instructions}
                                  </p>
                                )}
                              </div>
                            ),
                          )}
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setViewOpen((prev) => ({
                                ...prev,
                                [prescription.id]: true,
                              }))
                            }
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCompleted}
                            title={
                              isCompleted ? "Prescription is completed" : ""
                            }
                            onClick={() => {
                              const params = new URLSearchParams({
                                editId: prescription.id,
                              });
                              if (prescription.patient?.id)
                                params.set(
                                  "patientId",
                                  prescription.patient.id,
                                );
                              if (prescription.consultation?.appointmentId) {
                                params.set(
                                  "appointmentId",
                                  prescription.consultation.appointmentId,
                                );
                                params.set("consultation", "true");
                              }
                              router.push(
                                `/prescriptions?${params.toString()}`,
                              );
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (!confirm("Delete this prescription?")) return;
                              const res = await fetch(
                                `/api/prescriptions?id=${prescription.id}`,
                                { method: "DELETE" },
                              );
                              if (res.ok) {
                                toast.success("Deleted");
                                fetchPrescriptions();
                              } else {
                                toast.error("Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                          <Button
                            className={`size-sm ${isCompleted ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                            size="sm"
                            disabled={isCompleted}
                            onClick={async () => {
                              if (isCompleted) return;
                              // If appointment exists, mark it complete consistently
                              const apptId =
                                prescription.consultation?.appointmentId;
                              if (apptId) {
                                const res = await fetch(
                                  `/api/appointments/${apptId}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      status: "COMPLETED",
                                    }),
                                  },
                                );
                                // also mark prescription payload COMPLETE for UI consistency
                                await fetch(
                                  `/api/prescriptions?id=${prescription.id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      status: "COMPLETED",
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  toast.success("Appointment marked complete");
                                  fetchPrescriptions();
                                  return;
                                }
                              }
                              // mark complete by setting status in medicines JSON
                              const res = await fetch(
                                `/api/prescriptions?id=${prescription.id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: "COMPLETED" }),
                                },
                              );
                              if (res.ok) {
                                toast.success("Marked complete");
                                fetchPrescriptions();
                              } else {
                                toast.error("Update failed");
                              }
                            }}
                          >
                            {isCompleted ? "Completed" : "Mark Complete"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Modal(s) */}
      {Object.entries(viewOpen).map(([id, open]) => (
        <PrescriptionViewModal
          key={id}
          id={id}
          open={!!open}
          onClose={() => setViewOpen((prev) => ({ ...prev, [id]: false }))}
        />
      ))}
    </div>
  );
}
