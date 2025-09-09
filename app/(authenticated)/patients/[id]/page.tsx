"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  Activity,
  FileText,
  Clock,
  Edit,
} from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: {
    id: string;
    name: string;
    department?: string;
  };
  department: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes?: string;
}

export default function PatientDetails() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);

        // Skip if the ID is not a valid patient ID (e.g., "register", "new", etc.)
        if (!params.id || params.id === "register" || params.id === "new") {
          setLoading(false);
          return;
        }

        // Fetch actual patient data from API
        const response = await fetch(`/api/patients/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data.patient);
        } else {
          console.error("Failed to fetch patient details for ID:", params.id);
          console.error("Response status:", response.status);
        }

        // Fetch patient appointments
        const appointmentsResponse = await fetch(
          `/api/appointments?patientId=${params.id}`,
        );
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData.appointments || []);
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatientDetails();
    }
  }, [params.id]);

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Patient not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-gray-600">Patient Details</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Full Name
                  </label>
                  <p className="text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Age
                  </label>
                  <p className="text-gray-900">
                    {patient.dateOfBirth
                      ? calculateAge(patient.dateOfBirth)
                      : "N/A"}{" "}
                    years
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Gender
                  </label>
                  <p className="text-gray-900">{patient.gender || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Blood Group
                  </label>
                  <p className="text-gray-900">{patient.bloodGroup || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Phone
                  </label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {patient.phone}
                  </p>
                </div>
                {patient.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {patient.email}
                    </p>
                  </div>
                )}
                {patient.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {patient.address}
                    </p>
                  </div>
                )}
                {patient.emergencyContact && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Emergency Contact
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {patient.emergencyContact}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.medicalHistory && patient.medicalHistory.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Medical History
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {patient.medicalHistory.map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Allergies
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {patient.allergies.map((allergy, index) => (
                      <Badge key={index} className="bg-red-100 text-red-800">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/book-appointment?patientId=${patient.id}`}>
                <Button className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/patients/${patient.id}/records`)}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Records
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/patients/${patient.id}/history`)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Medical History
              </Button>
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No appointments found</p>
                ) : (
                  appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          Dr. {appointment.doctor?.name || "Unknown Doctor"}
                        </span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {appointment.department}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.date} at {appointment.time}
                      </p>
                      {appointment.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
