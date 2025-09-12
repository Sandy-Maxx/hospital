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
import { Select } from "@/components/ui/select";
import SoapForm, { SoapNotes, Vitals } from "@/components/soap/soap-form";
import BottomSheet from "@/components/ui/bottom-sheet";
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

interface QueueItem {
  id: string;
  date: string;
  time: string;
  status: string;
  tokenNumber?: string;
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
  const [doctors, setDoctors] = useState<any[]>([]);
  const [soapOpen, setSoapOpen] = useState<{ [id: string]: boolean }>({});
  const [selectedSoapId, setSelectedSoapId] = useState<string | null>(null);
  const [soapNotes, setSoapNotes] = useState<{
    [id: string]: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
    };
  }>({});
  const [vitals, setVitals] = useState<{
    [id: string]: {
      temperature?: string;
      bloodPressure?: string;
      pulse?: string;
      respiratoryRate?: string;
      oxygenSaturation?: string;
    };
  }>({});

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const url = `/api/appointments?date=${today}&status=SCHEDULED,ARRIVED,WAITING,IN_CONSULTATION`;
      const data = await apiClient.getJSON<{ appointments: any[] }>(
        url,
        { cacheKey: `queue:${today}`, ttl: 30_000 }
      );
      setQueueItems(data.appointments || []);
    } catch (error) {
      toast.error("Failed to fetch queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    if (session?.user?.role && session.user.role !== "NURSE") {
      fetchDoctors();
    }
    // Refresh queue more frequently (every 10s)
    const interval = setInterval(fetchQueue, 10000);

    // Refresh when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchQueue();
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
              fetchQueue();
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

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await apiClient.requestJSON(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { status: newStatus },
      });
      if (res.queued) {
        toast.success("Status change queued (offline)");
      } else {
        toast.success("Status updated successfully");
      }
      fetchQueue();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const reassignDoctor = async (appointmentId: string, newDoctorId: string) => {
    try {
      const res = await apiClient.requestJSON(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        body: { doctorId: newDoctorId },
      });
      if (res.queued) {
        toast.success("Doctor reassignment queued (offline)");
      } else {
        toast.success("Doctor reassigned successfully");
      }
      fetchQueue();
    } catch (error) {
      console.error("Error reassigning doctor:", error);
      toast.error("Something went wrong");
    }
  };

  const saveSoap = async (appointmentId: string) => {
    try {
      const notes = soapNotes[appointmentId] || {
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      };
      const vit = vitals[appointmentId] || {};
      const res = await apiClient.requestJSON(`/api/appointments/${appointmentId}/soap`, {
        method: "PATCH",
        body: {
          soapNotes: notes,
          quickNotes: { vitalSigns: vit },
        },
      });
      if (res.queued) {
        toast.success("SOAP update queued (offline)");
      } else {
        toast.success("SOAP saved for this appointment");
        setSoapOpen((prev) => ({ ...prev, [appointmentId]: false }));
      }
    } catch (e) {
      toast.error("Something went wrong");
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
          key="status"
          value={item.status}
          onChange={(e) => {
            const newStatus = e.target.value;
            if (newStatus === "IN_CONSULTATION" && item.status === "WAITING") {
              startConsultation(item.id, item.patient.id);
            } else {
              updateStatus(item.id, newStatus);
            }
          }}
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARRIVED">Arrived</option>
          <option value="WAITING">Waiting</option>
          <option value="IN_CONSULTATION">In Consultation</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </Select>,
      );

      // Doctor reassignment dropdown
      if (doctors.length > 0) {
        actions.push(
          <Select
            key="doctor"
            value={item.doctor.id}
            onChange={(e) => reassignDoctor(item.id, e.target.value)}
          >
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.name}
              </option>
            ))}
          </Select>,
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
            onClick={() => startConsultation(item.id, item.patient.id)}
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
                            {appointment.tokenNumber || "#"}
                          </span>
                          {appointment.atDoor && (
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
                              {item.doctor.name}
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
                              onClick={() => {
                                setSelectedSoapId(item.id);
                                setSoapOpen((prev) => ({ ...prev, [item.id]: true }));
                                // initialize default state if not present
                                setSoapNotes((prev) => ({
                                  ...prev,
                                  [item.id]: prev[item.id] || {
                                    subjective: "",
                                    objective: "",
                                    assessment: "",
                                    plan: "",
                                  },
                                }));
                              }}
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
      {/* Mobile SOAP Bottom Sheet */}
      <BottomSheet
        isOpen={!!(selectedSoapId && soapOpen[selectedSoapId])}
        onClose={() => {
          if (selectedSoapId) {
            setSoapOpen((prev) => ({ ...prev, [selectedSoapId]: false }));
          }
          setSelectedSoapId(null);
        }}
        title="SOAP Notes"
      >
        {selectedSoapId && (
          <div className="space-y-4">
            <SoapForm
              soap={soapNotes[selectedSoapId] || { subjective: "", objective: "", assessment: "", plan: "" }}
              vitals={vitals[selectedSoapId] || {}}
              onChangeSoap={(next) => setSoapNotes((prev) => ({ ...prev, [selectedSoapId]: next }))}
              onChangeVitals={(next) => setVitals((prev) => ({ ...prev, [selectedSoapId]: next }))}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedSoapId) {
                    setSoapOpen((prev) => ({ ...prev, [selectedSoapId]: false }));
                  }
                  setSelectedSoapId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedSoapId) saveSoap(selectedSoapId);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
