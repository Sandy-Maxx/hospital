import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const problemCategoryUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").optional(),
  icon: z.string().max(50, "Icon name must be less than 50 characters").optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// GET - Get a specific problem category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.problemCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Problem category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching problem category:", error);
    return NextResponse.json(
      { error: "Failed to fetch problem category" },
      { status: 500 }
    );
  }
}

// PUT - Update a problem category (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = problemCategoryUpdateSchema.parse(data);

    // Check if category exists
    const existingCategory = await prisma.problemCategory.findUnique({
      where: { id: params.id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Problem category not found" },
        { status: 404 }
      );
    }

    // Check if name is being updated and if it conflicts with another category
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameConflict = await prisma.problemCategory.findUnique({
        where: { name: validatedData.name }
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.problemCategory.update({
      where: { id: params.id },
      data: validatedData,
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

    console.error("Error updating problem category:", error);
    return NextResponse.json(
      { error: "Failed to update problem category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a problem category (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if category exists and has appointments
    const category = await prisma.problemCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Problem category not found" },
        { status: 404 }
      );
    }

    if (category._count.appointments > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that has associated appointments. Consider marking it as inactive instead." },
        { status: 400 }
      );
    }

    await prisma.problemCategory.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: "Problem category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting problem category:", error);
    return NextResponse.json(
      { error: "Failed to delete problem category" },
      { status: 500 }
    );
  }
}
