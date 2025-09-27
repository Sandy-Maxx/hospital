import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const LANDING_SETTINGS_FILE = path.join(process.cwd(), "data", "landing-page-settings.json");

// Default landing page settings
const defaultSettings = {
  heroTitle: "Welcome to {hospitalName}",
  heroSubtitle: "Experience world-class healthcare with compassion and innovation",
  heroImages: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
  ],
  heroButtonText: "Book Appointment",
  heroSecondaryButtonText: "Learn More",
  enableHeroSlider: true,
  sliderAutoplay: true,
  sliderInterval: 5000,
  aboutTitle: "About Us",
  aboutDescription: "We are committed to providing exceptional healthcare services with compassion, innovation, and excellence. Our team of dedicated professionals works tirelessly to ensure the best possible care for our patients.",
  aboutImage: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  visionImage: "",
  missionImage: "",
  featuresTitle: "Why Choose Us?",
  featuresSubtitle: "Comprehensive healthcare services with modern technology",
  enableFeatures: true,
  enableAnimations: true,
  animationSpeed: "normal",
  heroOverlayColor: "#1e40af",
  heroOverlayOpacity: 0.8,
  buttonStyle: "pill",
  // Floating CTA & contacts
  showFloatingCta: true,
  ctaWhatsApp: "",
  ctaPhone: "",
  ctaEmail: "",
};

function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readLandingSettings() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(LANDING_SETTINGS_FILE)) {
      const data = fs.readFileSync(LANDING_SETTINGS_FILE, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error reading landing page settings:", error);
    return defaultSettings;
  }
}

function writeLandingSettings(settings: any) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(LANDING_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing landing page settings:", error);
    return false;
  }
}

export async function GET() {
  try {
    const settings = readLandingSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in GET /api/settings/landing-page:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing page settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["heroTitle", "heroSubtitle", "heroButtonText"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Merge with existing settings
    const currentSettings = readLandingSettings();
    const updatedSettings = { ...currentSettings, ...body };

    // Save settings
    const success = writeLandingSettings(updatedSettings);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to save landing page settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Landing page settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error in POST /api/settings/landing-page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Alias PUT to POST for convenience
}
