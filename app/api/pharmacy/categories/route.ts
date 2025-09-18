import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/pharmacy/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const categories = await prisma.medicineCategory.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            medicines: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    return NextResponse.json({
      categories,
      totalCount: categories.length
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/pharmacy/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.medicineCategory.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT /api/pharmacy/categories - Update category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.medicineCategory.update({
      where: { id },
      data: {
        ...updateData,
        name: updateData.name?.trim(),
        description: updateData.description?.trim() || null,
      },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("Error updating category:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/pharmacy/categories - Delete category (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category has associated medicines
    const medicineCount = await prisma.medicine.count({
      where: {
        categoryId: id,
        isActive: true,
      },
    });

    if (medicineCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated medicines. Please reassign medicines first." },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    const category = await prisma.medicineCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ 
      message: "Category deleted successfully",
      category: { id: category.id, isActive: category.isActive }
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
