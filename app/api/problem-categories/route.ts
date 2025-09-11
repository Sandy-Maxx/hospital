import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const problemCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
  icon: z.string().max(50, "Icon name must be less than 50 characters").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// GET - Fetch all problem categories (public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause = includeInactive ? {} : { isActive: true };

    const categories = await prisma.problemCategory.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" }
      ],
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error fetching problem categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch problem categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new problem category (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = problemCategorySchema.parse(data);

    // Check if category with same name already exists
    const existingCategory = await prisma.problemCategory.findUnique({
      where: { name: validatedData.name }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.problemCategory.create({
      data: {
        ...validatedData,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating problem category:", error);
    return NextResponse.json(
      { error: "Failed to create problem category" },
      { status: 500 }
    );
  }
}
