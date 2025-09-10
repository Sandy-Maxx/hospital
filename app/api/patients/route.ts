import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiCache } from "@/lib/api-cache";
import { z } from "zod";
import { withAuth } from "@/lib/authz";

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  idProof: z.string().optional(),
  idNumber: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);

    // Simple in-memory cache by URL for GET responses
    const cacheKey = request.url;
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    const search = searchParams.get("search");
    const gender = searchParams.get("gender");
    const bloodGroup = searchParams.get("bloodGroup");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sort = searchParams.get("sort") || "createdAt";
    const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }
    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as any).gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23,59,59,999);
        (where.createdAt as any).lte = end;
      }
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order as any },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          createdAt: true,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    const result = {
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
    apiCache.set(cacheKey, result, 5 * 60 * 1000);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request, ["ADMIN", "RECEPTIONIST"]);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validatedData = patientSchema.parse(body);

    // Check if patient with same phone already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { phone: validatedData.phone },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: "Patient with this phone number already exists" },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : null,
        email: validatedData.email || null,
      },
    });

    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
