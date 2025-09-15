import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, CONVERTED
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");

    // Since we don't have AdmissionRequest table yet, let's simulate with prescription data
    // that has IPD admission notes for now
    const where: any = {};
    
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    // For now, we'll look for prescriptions with IPD-related notes
    // This is a temporary implementation until we add the proper schema
    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...where,
        notes: {
          contains: "IPD" // Temporary filter for IPD-related prescriptions
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            department: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    // Transform to look like admission requests
    const admissionRequests = prescriptions.map(prescription => ({
      id: prescription.id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      prescriptionId: prescription.id,
      wardType: null, // Will be extracted from notes in production
      bedType: null,
      urgency: "NORMAL",
      estimatedStay: null,
      diagnosis: prescription.diagnosis || "",
      chiefComplaint: prescription.symptoms || "",
      notes: prescription.notes || "",
      status: "PENDING", // Default for now
      requestedAt: prescription.createdAt,
      processedAt: null,
      processedBy: null,
      patient: prescription.patient,
      doctor: prescription.doctor,
      createdAt: prescription.createdAt
    }));

    return NextResponse.json({
      admissionRequests,
      total: admissionRequests.length
    });

  } catch (error) {
    console.error("Error fetching admission requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch admission requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, ["DOCTOR", "ADMIN"]);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const {
      patientId,
      prescriptionId,
      wardType,
      bedType,
      urgency = "NORMAL",
      estimatedStay,
      diagnosis,
      chiefComplaint,
      notes
    } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // For now, we'll store the admission request data in the prescription notes
    // This is temporary until we add the proper AdmissionRequest table
    const admissionData = {
      type: "IPD_ADMISSION_REQUEST",
      wardType,
      bedType,
      urgency,
      estimatedStay,
      diagnosis,
      chiefComplaint,
      requestNotes: notes,
      status: "PENDING",
      requestedAt: new Date().toISOString()
    };

    let prescription;
    if (prescriptionId) {
      // Get existing prescription first
      const existingPrescription = await prisma.prescription.findUnique({
        where: { id: prescriptionId }
      });
      
      // Update existing prescription with admission request
      prescription = await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          notes: `${existingPrescription?.notes || ""}\n\nIPD ADMISSION REQUEST: ${JSON.stringify(admissionData)}`
        }
      });
    } else {
      // Create new prescription with admission request
      prescription = await prisma.prescription.create({
        data: {
          patientId,
          doctorId: authResult.session.user.id,
          medicines: JSON.stringify({ medicines: [], labTests: [], therapies: [] }),
          notes: `IPD ADMISSION REQUEST: ${JSON.stringify(admissionData)}`,
          diagnosis: diagnosis || "",
          symptoms: chiefComplaint || ""
        }
      });
    }

    return NextResponse.json({
      message: "Admission request created successfully",
      admissionRequest: {
        id: prescription.id,
        patientId,
        status: "PENDING",
        createdAt: prescription.createdAt
      }
    });

  } catch (error) {
    console.error("Error creating admission request:", error);
    return NextResponse.json(
      { error: "Failed to create admission request" },
      { status: 500 }
    );
  }
}
