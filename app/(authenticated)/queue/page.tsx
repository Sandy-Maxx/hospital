"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import {
  Clock,
  User,
  Phone,
  Activity,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import Breadcrumb from "@/components/navigation/breadcrumb";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api-client";

// Load the same SOAP UI used in prescriptions page (with checkboxes, vitals, etc.)
const ConsultationNotes = dynamic(
  () => import("@/components/soap/consultation-notes"),
  { ssr: false },
);
// Load the same PrescriptionForm used on /prescriptions
const PrescriptionForm = dynamic(
  () => import("@/components/prescriptions/prescription-form"),
  { ssr: false },
);

interface QueueItem {
  id: string;
  date: string;
  time: string;
  status: string;
  tokenNumber?: string;
  atDoor?: boolean;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    id: string;
    name: string;
  };
}

const statusConfig = {
  WAITING: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    label: "Waiting",
  },
  IN_CONSULTATION: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Activity,
    label: "In Consultation",
  },
  ARRIVED: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: User,
    label: "Arrived",
  },
};

export default function Queue() {
  const { data: session } = useSession();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  // Nurse SOAP modal state
  const [soapOpen, setSoapOpen] = useState(false);
  const [soapSaving, setSoapSaving] = useState(false);
  const [soapAppointmentId, setSoapAppointmentId] = useState<string | null>(null);
  const [soapPatient, setSoapPatient] = useState<{ id: string; name: string } | null>(null);
  const [soapNotes, setSoapNotes] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [quickNotes, setQuickNotes] = useState({
    commonSymptoms: [] as string[],
    vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
    commonDiagnoses: [] as string[],
  });

  // Doctor consultation modal state
  const [docOpen, setDocOpen] = useState(false);
  const [docAppointmentId, setDocAppointmentId] = useState<string | null>(null);
  const [docPatient, setDocPatient] = useState<any | null>(null);
  const [docSoapNotes, setDocSoapNotes] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [docQuickNotes, setDocQuickNotes] = useState({
    commonSymptoms: [] as string[],
    vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
    commonDiagnoses: [] as string[],
  });

  const fetchQueue = async (suppressLoading: boolean = false) => {
    try {
      if (!suppressLoading && isInitialLoad) setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const url = `/api/appointments?date=${today}&status=SCHEDULED,ARRIVED,WAITING,IN_CONSULTATION`;
      const data = await apiClient.getJSON<{ appointments: any[] }>(
        url,
        { cacheKey: `queue:${today}`, ttl: 30_000 }
      );
      // Only update if no items are currently being updated to prevent overriding optimistic updates
      if (updating.size === 0) {
        setQueueItems(data.appointments || []);
      } else {
        // Merge new data with currently updating items to preserve optimistic updates
        setQueueItems(prevItems => {
          const newItems = data.appointments || [];
          return prevItems.map(prevItem => {
            if (updating.has(prevItem.id)) {
              // Keep the optimistically updated item
              return prevItem;
            } else {
              // Use new data from server
              const serverItem = newItems.find(item => item.id === prevItem.id);
              return serverItem || prevItem;
            }
          });
        });
      }
    } catch (error) {
      toast.error("Failed to fetch queue");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchQueue(true);
    if (session?.user?.role && session.user.role !== "NURSE") {
      fetchDoctors();
    }
    // Reduce periodic refresh to minimize blinking; rely on SSE for instant updates
    const interval = setInterval(() => fetchQueue(true), 60000);

    // Refresh when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchQueue(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Subscribe to SSE for immediate updates
    let es: EventSource | null = null;
    if (typeof window !== "undefined") {
      try {
        es = new EventSource("/api/queue/stream");
        es.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg?.event === "queue-update") {
              fetchQueue(true);
            }
          } catch {}
        };
      } catch {}
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      try { es?.close(); } catch {}
    };
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const openSoapModal = async (item: QueueItem) => {
    try {
      setSoapAppointmentId(item.id);
      setSoapPatient({ id: item.patient.id, name: `${item.patient.firstName} ${item.patient.lastName}` });
      // Prefill from existing appointment notes
      const res = await fetch(`/api/appointments/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        const rawNotes = data?.appointment?.notes;
        if (rawNotes) {
          try {
            const parsed = JSON.parse(rawNotes);
            if (parsed?.soapNotes) {
              setSoapNotes({
                subjective: parsed.soapNotes.subjective || "",
                objective: parsed.soapNotes.objective || "",
                assessment: parsed.soapNotes.assessment || "",
                plan: parsed.soapNotes.plan || "",
              });
            } else {
              setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
            }
            if (parsed?.quickNotes) {
              setQuickNotes({
                commonSymptoms: parsed.quickNotes.commonSymptoms || [],
                vitalSigns: {
                  temperature: parsed.quickNotes.vitalSigns?.temperature || "",
                  bloodPressure: parsed.quickNotes.vitalSigns?.bloodPressure || "",
                  pulse: parsed.quickNotes.vitalSigns?.pulse || "",
                  respiratoryRate: parsed.quickNotes.vitalSigns?.respiratoryRate || "",
                  oxygenSaturation: parsed.quickNotes.vitalSigns?.oxygenSaturation || "",
                },
                commonDiagnoses: parsed.quickNotes.commonDiagnoses || [],
              });
            } else {
              setQuickNotes({
                commonSymptoms: [],
                vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
                commonDiagnoses: [],
              });
            }
          } catch {
            setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
            setQuickNotes({
              commonSymptoms: [],
              vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
              commonDiagnoses: [],
            });
          }
        } else {
          setSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
          setQuickNotes({
            commonSymptoms: [],
            vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
            commonDiagnoses: [],
          });
        }
      }
    } catch {}
    setSoapOpen(true);
  };

  const saveSoap = async () => {
    if (!soapAppointmentId) return;
    setSoapSaving(true);
    try {
      const res = await fetch(`/api/appointments/${soapAppointmentId}/soap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soapNotes, quickNotes }),
      });
      if (res.ok) {
        toast.success("SOAP saved");
        setSoapOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save SOAP");
      }
    } catch {
      toast.error("Failed to save SOAP");
    } finally {
      setSoapSaving(false);
    }
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    // Prevent multiple simultaneous updates for the same item
    if (updating.has(appointmentId)) {
      return;
    }
    
    // Add to updating set
    setUpdating(prev => new Set(prev).add(appointmentId));
    
    // Store the original state for potential revert
    const originalItems = [...queueItems];
    
    // Optimistically update the UI immediately
    setQueueItems(prevItems => 
      prevItems.map(i => 
        i.id === appointmentId ? { ...i, status: newStatus } : i
      )
    );
    
    try {
      const res = await apiClient.requestJSON(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      if (res.queued) {
        toast.success("Status change queued (offline)");
      } else {
        toast.success("Status updated");
      }
    } catch (error) {
      toast.error("Failed to update status");
      // Revert the optimistic update on error
      setQueueItems(originalItems);
    } finally {
      // Remove from updating set after a small delay to prevent rapid successive calls
      setTimeout(() => {
        setUpdating(prev => {
          const newSet = new Set(prev);
          newSet.delete(appointmentId);
          return newSet;
        });
      }, 300);
    }
  };

  const reassignDoctor = async (appointmentId: string, newDoctorId: string) => {
    // Prevent multiple simultaneous updates for the same item
    if (updating.has(appointmentId)) {
      return;
    }
    
    // Add to updating set
    setUpdating(prev => new Set(prev).add(appointmentId));
    
    // Store the original state for potential revert
    const originalItems = [...queueItems];
    
    // Optimistically update the UI immediately
    const doc = doctors.find((d) => d.id === newDoctorId);
    if (doc) {
      setQueueItems(prevItems =>
        prevItems.map(i => 
          i.id === appointmentId ? { ...i, doctor: { id: newDoctorId, name: doc.name } } : i
        )
      );
    }
    
    try {
      const res = await apiClient.requestJSON(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { doctorId: newDoctorId },
      });
      if (res.queued) {
        toast.success("Doctor reassignment queued (offline)");
      } else {
        toast.success("Doctor reassigned");
      }
    } catch (error) {
      console.error("Error reassigning doctor:", error);
      toast.error("Failed to reassign doctor");
      // Revert the optimistic update on error
      setQueueItems(originalItems);
    } finally {
      // Remove from updating set after a small delay to prevent rapid successive calls
      setTimeout(() => {
        setUpdating(prev => {
          const newSet = new Set(prev);
          newSet.delete(appointmentId);
          return newSet;
        });
      }, 300);
    }
  };


  const startConsultation = async (
    appointmentId: string,
    patientId: string,
  ) => {
    console.log("Queue: Start consultation called with:", {
      appointmentId,
      patientId,
    });

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_CONSULTATION" }),
      });

      console.log("Queue: API response status:", response.status);

      if (response.ok) {
        toast.success("Starting consultation...");

        // Refresh queue to show updated status
        fetchQueue();

        // Navigate to prescription page with consultation parameters
        const url = `/prescriptions?patientId=${patientId}&appointmentId=${appointmentId}&consultation=true`;
        // dev-only log: Navigating to
        window.location.href = url;
      } else {
        const errorData = await response.json();
        console.error("Queue: API error:", errorData);
        toast.error("Failed to start consultation");
      }
    } catch (error) {
      console.error("Queue: Error starting consultation:", error);
      toast.error("Something went wrong");
    }
  };

  const getStatusActions = (item: QueueItem) => {
    const actions = [];

    // Status change buttons - available for all authorized users
    if (
      session?.user.role === "DOCTOR" ||
      session?.user.role === "RECEPTIONIST" ||
      session?.user.role === "ADMIN"
    ) {
      // Status dropdown for flexible status management
      actions.push(
        <Select
          key={`status-${item.id}`}
          value={item.status}
          onValueChange={(newStatus) => updateStatus(item.id, newStatus)}
          disabled={updating.has(item.id)}
        >
          <SelectTrigger className={`w-40 bg-white border border-gray-300 ${updating.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <SelectValue placeholder="Select Status">{item.status.replace("_", " ")}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="SCHEDULED" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Scheduled</SelectItem>
            <SelectItem value="ARRIVED" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Arrived</SelectItem>
            <SelectItem value="WAITING" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Waiting</SelectItem>
            <SelectItem value="COMPLETED" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Completed</SelectItem>
            <SelectItem value="CANCELLED" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">No Show</SelectItem>
          </SelectContent>
        </Select>
      );

      // Doctor reassignment dropdown
      if (doctors.length > 0) {
        actions.push(
        <Select
          key={`doctor-${item.id}`}
          value={item.doctor.id}
          onValueChange={(newDoctorId) => reassignDoctor(item.id, newDoctorId)}
          disabled={updating.has(item.id)}
        >
          <SelectTrigger className={`w-48 bg-white border border-gray-300 ${updating.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <SelectValue placeholder="Select Doctor">{item.doctor.name.startsWith('Dr.') ? item.doctor.name : `Dr. ${item.doctor.name}`}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id} className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">
                {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        );
      }
    }

    // Quick action buttons for doctors
    if (session?.user.role === "DOCTOR") {
      if (item.status === "WAITING") {
        actions.push(
          <Button
            key="consultation"
            size="sm"
            onClick={() => openDoctorConsultation(item)}
          >
            Start Consultation
          </Button>,
        );
      }

      if (item.status === "IN_CONSULTATION") {
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="success"
            onClick={() => updateStatus(item.id, "COMPLETED")}
          >
            Complete
          </Button>,
        );
      }
    }

    return actions;
  };

  const waitingCount = queueItems.filter(
    (item) => item.status === "WAITING",
  ).length;
  const inConsultationCount = queueItems.filter(
    (item) => item.status === "IN_CONSULTATION",
  ).length;

  // Doctor Start Consultation -> open modal with SOAP + PrescriptionForm
  const openDoctorConsultation = async (item: QueueItem) => {
    try {
      // Update status first (optimistic UI already applied by getStatusActions if we want)
      await updateStatus(item.id, "IN_CONSULTATION");
      setDocAppointmentId(item.id);

      // Fetch patient details for PrescriptionForm
      try {
        const pres = await fetch(`/api/patients/${item.patient.id}`);
        if (pres.ok) {
          const data = await pres.json();
          const p = data.patient;
          setDocPatient({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            phone: p.phone || "",
            age: p.dateOfBirth ? Math.max(0, Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / (365.25*24*60*60*1000))) : 0,
            gender: p.gender || "OTHER",
          });
        } else {
          setDocPatient({ id: item.patient.id, firstName: item.patient.firstName, lastName: item.patient.lastName, phone: item.patient.phone || "", age: 0, gender: "OTHER" });
        }
      } catch {
        setDocPatient({ id: item.patient.id, firstName: item.patient.firstName, lastName: item.patient.lastName, phone: item.patient.phone || "", age: 0, gender: "OTHER" });
      }

      // Prefill SOAP from appointment notes
      try {
        const res = await fetch(`/api/appointments/${item.id}`);
        if (res.ok) {
          const data = await res.json();
          const rawNotes = data?.appointment?.notes;
          if (rawNotes) {
            const parsed = JSON.parse(rawNotes);
            if (parsed?.soapNotes) {
              setDocSoapNotes({
                subjective: parsed.soapNotes.subjective || "",
                objective: parsed.soapNotes.objective || "",
                assessment: parsed.soapNotes.assessment || "",
                plan: parsed.soapNotes.plan || "",
              });
            } else {
              setDocSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
            }
            if (parsed?.quickNotes) {
              setDocQuickNotes({
                commonSymptoms: parsed.quickNotes.commonSymptoms || [],
                vitalSigns: {
                  temperature: parsed.quickNotes.vitalSigns?.temperature || "",
                  bloodPressure: parsed.quickNotes.vitalSigns?.bloodPressure || "",
                  pulse: parsed.quickNotes.vitalSigns?.pulse || "",
                  respiratoryRate: parsed.quickNotes.vitalSigns?.respiratoryRate || "",
                  oxygenSaturation: parsed.quickNotes.vitalSigns?.oxygenSaturation || "",
                },
                commonDiagnoses: parsed.quickNotes.commonDiagnoses || [],
              });
            } else {
              setDocQuickNotes({
                commonSymptoms: [],
                vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
                commonDiagnoses: [],
              });
            }
          } else {
            setDocSoapNotes({ subjective: "", objective: "", assessment: "", plan: "" });
            setDocQuickNotes({
              commonSymptoms: [],
              vitalSigns: { temperature: "", bloodPressure: "", pulse: "", respiratoryRate: "", oxygenSaturation: "" },
              commonDiagnoses: [],
            });
          }
        }
      } catch {}

      setDocOpen(true);
    } catch (e) {
      toast.error("Failed to start consultation");
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Queue", href: "/queue" }]} />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Clock className="w-8 h-8 mr-3 text-primary-600" />
          Patient Queue
        </h1>
        <p className="text-gray-600 mt-2">Real-time patient queue management</p>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Waiting</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {waitingCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  In Consultation
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {inConsultationCount}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total in Queue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {queueItems.length}
                </p>
              </div>
              <User className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Queue</CardTitle>
          <CardDescription>
            Live patient queue with real-time status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : queueItems.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No patients in queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueItems.map((item) => {
                const statusInfo =
                  statusConfig[item.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo?.icon || Clock;

                return (
                  <div
                    key={item.id}
                    className={`border-2 rounded-lg p-4 transition-all ${statusInfo?.color || "border-gray-200"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center relative">
                          <span className="text-primary-600 font-medium">
                            {item.tokenNumber || "#"}
                          </span>
                          {item.atDoor && (
                            <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-600 text-white text-[10px] px-1 animate-pulse" title="Patient at door">
                              AT
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.patient.firstName} {item.patient.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(item.time)}
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {item.doctor.name.startsWith('Dr.') ? item.doctor.name : `Dr. ${item.doctor.name}`}
                            </span>
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {item.patient.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-medium">
                            {statusInfo?.label || item.status}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {getStatusActions(item)}
                          {session?.user.role === "NURSE" && (
                            <Button
                              key={`soap-${item.id}`}
                              size="sm"
                              onClick={() => openSoapModal(item)}
                            >
                              SOAP
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Nurse SOAP Modal */}
      <Dialog open={soapOpen} onOpenChange={setSoapOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nurse SOAP Entry</DialogTitle>
            <DialogDescription>
              {soapPatient ? `For ${soapPatient.name}` : "Fill SOAP notes and vitals"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ConsultationNotes
              soapNotes={soapNotes}
              quickNotes={quickNotes}
              onChangeSoap={setSoapNotes}
              onChangeQuick={setQuickNotes}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSoapOpen(false)} disabled={soapSaving}>Cancel</Button>
            <Button onClick={saveSoap} disabled={soapSaving} className="bg-blue-600 hover:bg-blue-700">
              {soapSaving ? "Saving..." : "Save SOAP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doctor Consultation Modal */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Consultation</DialogTitle>
            <DialogDescription>
              {docPatient ? `For ${docPatient.firstName} ${docPatient.lastName}` : "Fill SOAP and Prescription"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* SOAP section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Consultation Notes (SOAP)
                </CardTitle>
                <CardDescription>
                  Review or update the SOAP notes before prescribing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultationNotes
                  soapNotes={docSoapNotes}
                  quickNotes={docQuickNotes}
                  onChangeSoap={setDocSoapNotes}
                  onChangeQuick={setDocQuickNotes}
                />
              </CardContent>
            </Card>

            {/* Prescription form re-used exactly as in prescriptions page */}
            {docPatient && (
              <PrescriptionForm
                selectedPatient={docPatient}
                onSuccess={() => setDocOpen(false)}
                onCancel={() => setDocOpen(false)}
                consultationData={{
                  soapNotes: docSoapNotes,
                  quickNotes: docQuickNotes,
                  appointmentId: docAppointmentId,
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
