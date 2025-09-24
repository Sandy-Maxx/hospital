import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Get current edition from hospital settings file first
    let currentEdition = "BASIC";
    const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(settingsData);
      currentEdition = settings.currentEdition || "BASIC";
    } else {
      // Only use environment variables if settings file doesn't exist
      currentEdition = process.env.NEXT_PUBLIC_HOSPITAL_EDITION || process.env.HOSPITAL_EDITION || "BASIC";
    }
    
    return NextResponse.json({
      edition: currentEdition,
      features: getFeaturesForEdition(currentEdition)
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch edition information" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user has superadmin role
    if (!session || (session.user as any).role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Access denied. Superadmin privileges required." },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { edition } = body;
    
    // Validate edition
    const validEditions = ["BASIC", "ADVANCED", "ENTERPRISE"];
    if (!validEditions.includes(edition)) {
      return NextResponse.json(
        { error: "Invalid edition. Must be BASIC, ADVANCED, or ENTERPRISE." },
        { status: 400 }
      );
    }
    
    // Update the environment configuration
    // In a real implementation, this would update the actual environment variables
    // For now, we'll just simulate the update
    console.log(`Edition updated to: ${edition}`);
    
    // Update hospital settings with the new edition
    const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(settingsData);
      
      // Add edition info to settings
      settings.currentEdition = edition;
      
      // Write the updated settings back to the file
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }
    
    return NextResponse.json({
      success: true,
      message: `Deployment edition updated to ${edition}`,
      edition: edition,
      features: getFeaturesForEdition(edition)
    });
  } catch (error) {
    console.error("Error updating edition:", error);
    return NextResponse.json(
      { error: "Failed to update edition" },
      { status: 500 }
    );
  }
}

function getFeaturesForEdition(edition: string) {
  const features = {
    BASIC: [
      "dashboard",
      "patients",
      "appointments",
      "queue",
      "prescriptions",
      "billing.basic",
      "reports.basic",
      "admin",
      "settings",
      "users",
      "doctorAvailability"
    ],
    ADVANCED: [
      "dashboard",
      "patients",
      "appointments",
      "queue",
      "prescriptions",
      "billing.basic",
      "reports.basic",
      "reports.advanced",
      "admin",
      "settings",
      "users",
      "doctorAvailability",
      "ipd",
      "lab",
      "imaging",
      "ot",
      "pharmacy",
      "pharmacy.queue",
      "roles",
      "permissions",
      "sse"
    ],
    ENTERPRISE: [
      "dashboard",
      "patients",
      "appointments",
      "queue",
      "prescriptions",
      "billing.basic",
      "reports.basic",
      "reports.advanced",
      "admin",
      "settings",
      "users",
      "doctorAvailability",
      "doctorQr",
      "ipd",
      "lab",
      "imaging",
      "ot",
      "pharmacy",
      "pharmacy.queue",
      "roles",
      "permissions",
      "auditLogs",
      "offline",
      "sse",
      "multiLocation",
      "marketing"
    ]
  };
  
  return features[edition as keyof typeof features] || features.BASIC;
}
