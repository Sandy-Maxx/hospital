import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Default hospital settings
const defaultSettings = {
  name: "MediCare Hospital",
  tagline: "Your Health, Our Priority",
  logo: "",
  primaryColor: "#2563eb",
  secondaryColor: "#1e40af",
  phone: "+1 (555) 123-4567",
  email: "info@medicare.com",
  address: "123 Health Street, Medical City, MC 12345",
  vision:
    "To be the leading healthcare provider, delivering exceptional medical care with compassion and innovation.",
  mission:
    "We are committed to providing comprehensive, patient-centered healthcare services that promote healing, wellness, and quality of life for our community.",

  // Appointment Settings
  tokenPrefix: "T",
  sessionPrefix: "S",
  defaultSessionDuration: 240, // 4 hours in minutes
  maxTokensPerSession: 50,
  allowPublicBooking: true,
  requirePatientDetails: true,
  autoAssignTokens: true,
  enableCarryForward: true,

  // Business Hours
  businessStartTime: "09:00",
  businessEndTime: "17:00",
  lunchBreakStart: "13:00",
  lunchBreakEnd: "14:00",

  // Session Templates
  sessionTemplates: [
    {
      id: "1",
      name: "Morning",
      shortCode: "S1",
      startTime: "09:00",
      endTime: "13:00",
      maxTokens: 50,
      isActive: true,
    },
    {
      id: "2",
      name: "Afternoon",
      shortCode: "S2",
      startTime: "14:00",
      endTime: "17:00",
      maxTokens: 40,
      isActive: true,
    },
    {
      id: "3",
      name: "Evening",
      shortCode: "S3",
      startTime: "17:00",
      endTime: "20:00",
      maxTokens: 30,
      isActive: false,
    },
  ],

  socialMedia: {
    facebook: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  },

  // Public URLs
  publicBaseUrl: "",
};

// Path to store settings file
const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load settings from file
function loadSettings() {
  try {
    ensureDataDir();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  return defaultSettings;
}

// Save settings to file
function saveSettings(settings: any) {
  try {
    ensureDataDir();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

export async function GET() {
  try {
    // In production, prefer DB settings if present, fallback to file
    if (process.env.NODE_ENV === 'production') {
      try {
        const db = await prisma.hospitalSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
        if (db) return NextResponse.json({ ...defaultSettings, ...db });
      } catch {}
    }
    const settings = loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching hospital settings:", error);
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Load current settings and merge with new data
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...data };

    // Validate hospital timings
    const timeToMinutes = (t: string) => {
      const [h, m] = (t || "0:0").split(":").map((n: string) => parseInt(n, 10));
      return h * 60 + m;
    };

    const bStart = timeToMinutes(updatedSettings.businessStartTime || "");
    const bEnd = timeToMinutes(updatedSettings.businessEndTime || "");
    if (!updatedSettings.businessStartTime || !updatedSettings.businessEndTime) {
      return NextResponse.json({ error: "Invalid Business Hours. Please set valid opening and closing times." }, { status: 400 });
    }
    // Allow cross-midnight business hours (e.g., 09:00 to 02:00 next day)
    // We'll validate this differently for sessions

    // Validate lunch break (optional but must be within business hours if provided)
    const hasLunch = updatedSettings.lunchBreakStart && updatedSettings.lunchBreakEnd;
    const lbStart = hasLunch ? timeToMinutes(updatedSettings.lunchBreakStart) : null;
    const lbEnd = hasLunch ? timeToMinutes(updatedSettings.lunchBreakEnd) : null;
    if (hasLunch && lbStart !== null && lbEnd !== null) {
      if (lbStart >= lbEnd) {
        return NextResponse.json({ error: "Invalid Lunch Break: start must be before end." }, { status: 400 });
      }
      // For cross-midnight business hours, lunch should be within the operational window
      const crossesMidnight = bEnd <= bStart;
      if (!crossesMidnight) {
        if (lbStart < bStart || lbEnd > bEnd) {
          return NextResponse.json({ error: "Invalid Lunch Break: must be within Business Hours." }, { status: 400 });
        }
      } else {
        // Cross-midnight business: lunch should not be in the closed period (bEnd to bStart)
        if (lbStart >= bEnd && lbEnd <= bStart) {
          return NextResponse.json({ error: "Invalid Lunch Break: cannot be during closed hours." }, { status: 400 });
        }
      }
    }

    // Validate session templates: start < end (allow cross-midnight), within business hours, no overlap with lunch, no overlaps with other sessions
    const templates = Array.isArray(updatedSettings.sessionTemplates) ? updatedSettings.sessionTemplates : [];
    const errors: string[] = [];
    const crossesMidnight = bEnd <= bStart;

    // Helper function to check if time is within business hours (handles cross-midnight)
    const isWithinBusinessHours = (time: number) => {
      if (!crossesMidnight) {
        return time >= bStart && time <= bEnd;
      } else {
        // Cross-midnight: time is valid if it's after start OR before end
        return time >= bStart || time <= bEnd;
      }
    };

    // Helper function to check session duration validity
    const getSessionDuration = (start: number, end: number) => {
      if (start <= end) {
        return end - start; // Normal session within same day
      } else {
        return (24 * 60 - start) + end; // Cross-midnight session
      }
    };

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      if (!t?.name || !t?.shortCode || !t?.startTime || !t?.endTime) {
        errors.push(`Template #${i + 1}: Missing required fields`);
        continue;
      }
      const s = timeToMinutes(t.startTime);
      const e = timeToMinutes(t.endTime);
      
      // Check if session duration is reasonable (max 12 hours)
      const duration = getSessionDuration(s, e);
      if (duration > 12 * 60) {
        errors.push(`Template "${t.name}": session duration cannot exceed 12 hours.`);
        continue;
      }
      
      // For cross-midnight sessions, both start and end should be within business hours
      if (!isWithinBusinessHours(s)) {
        errors.push(`Template "${t.name}": start time must be within Business Hours (${updatedSettings.businessStartTime} - ${updatedSettings.businessEndTime}).`);
      }
      if (!isWithinBusinessHours(e)) {
        errors.push(`Template "${t.name}": end time must be within Business Hours (${updatedSettings.businessStartTime} - ${updatedSettings.businessEndTime}).`);
      }
      
      // Check lunch break overlap (only for sessions that don't cross midnight)
      if (hasLunch && lbStart !== null && lbEnd !== null && s <= e) {
        if (Math.max(s, lbStart) < Math.min(e, lbEnd)) {
          errors.push(`Template "${t.name}": cannot overlap lunch break (${updatedSettings.lunchBreakStart} - ${updatedSettings.lunchBreakEnd}).`);
        }
      }
    }

    // Overlap check among active templates
    const active = templates.filter((t: any) => t.isActive);
    const sorted = [...active].sort((a: any, b: any) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (timeToMinutes(curr.startTime) < timeToMinutes(prev.endTime)) {
        errors.push(`Templates "${prev.name}" and "${curr.name}" overlap.`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    // Save to file
    const saved = saveSettings(updatedSettings);

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating hospital settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
