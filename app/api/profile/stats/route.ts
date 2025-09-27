import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

// Force dynamic behavior for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const profilesDir = path.join(process.cwd(), "data", "user-profiles");
const appointmentsDir = path.join(process.cwd(), "data", "appointments");
const prescriptionsDir = path.join(process.cwd(), "data", "prescriptions");

interface ProfileStats {
  totalExperience: number;
  totalAppointments: number;
  totalPrescriptions: number;
  totalRevenue: number;
  patientsSeen: number;
  availabilityPercentage: number;
  specializations: string[];
  departmentStats: {
    patientsInDepartment: number;
    departmentRanking: number;
  };
  monthlyStats: Array<{
    month: string;
    appointments: number;
    prescriptions: number;
    revenue: number;
  }>;
  recentAchievements: Array<{
    title: string;
    description: string;
    date: string;
    type: "milestone" | "recognition" | "certification";
  }>;
}

function calculateTotalExperience(experience: any[]): number {
  if (!experience || experience.length === 0) return 0;
  
  let totalMonths = 0;
  experience.forEach((exp) => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (endDate.getMonth() - startDate.getMonth());
    totalMonths += months;
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Return years with 1 decimal
}

function loadUserProfile(userId: string): any {
  const filePath = path.join(profilesDir, `${userId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

function loadUserAppointments(userId: string): any[] {
  const filePath = path.join(appointmentsDir, `${userId}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const appointments = JSON.parse(data);
    return Array.isArray(appointments) ? appointments : [];
  } catch (error) {
    return [];
  }
}

function loadUserPrescriptions(userId: string): any[] {
  const filePath = path.join(prescriptionsDir, `${userId}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const prescriptions = JSON.parse(data);
    return Array.isArray(prescriptions) ? prescriptions : [];
  } catch (error) {
    return [];
  }
}

function generateMonthlyStats(appointments: any[], prescriptions: any[]): any[] {
  const stats: Record<string, { appointments: number; prescriptions: number; revenue: number }> = {};
  
  // Get last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
    stats[monthKey] = { appointments: 0, prescriptions: 0, revenue: 0 };
  }
  
  // Count appointments
  appointments.forEach(appointment => {
    if (appointment.date) {
      const monthKey = appointment.date.slice(0, 7);
      if (stats[monthKey]) {
        stats[monthKey].appointments++;
        stats[monthKey].revenue += appointment.fee || 500; // Default fee
      }
    }
  });
  
  // Count prescriptions
  prescriptions.forEach(prescription => {
    if (prescription.date) {
      const monthKey = prescription.date.slice(0, 7);
      if (stats[monthKey]) {
        stats[monthKey].prescriptions++;
      }
    }
  });
  
  return Object.entries(stats).map(([month, data]) => ({
    month,
    ...data
  }));
}

function generateAchievements(profile: any, stats: any): any[] {
  const achievements = [];
  const now = new Date();
  
  // Experience milestones
  if (stats.totalExperience >= 10) {
    achievements.push({
      title: "Veteran Professional",
      description: `${stats.totalExperience} years of dedicated service`,
      date: now.toISOString(),
      type: "milestone"
    });
  } else if (stats.totalExperience >= 5) {
    achievements.push({
      title: "Experienced Professional",
      description: `${stats.totalExperience} years of service`,
      date: now.toISOString(),
      type: "milestone"
    });
  }
  
  // Patient care milestones
  if (stats.totalAppointments >= 1000) {
    achievements.push({
      title: "Patient Care Champion",
      description: `Served over ${stats.totalAppointments} patients`,
      date: now.toISOString(),
      type: "milestone"
    });
  } else if (stats.totalAppointments >= 100) {
    achievements.push({
      title: "Dedicated Caregiver",
      description: `Completed ${stats.totalAppointments} appointments`,
      date: now.toISOString(),
      type: "milestone"
    });
  }
  
  // Qualification achievements
  if (profile?.qualifications?.length > 0) {
    const latestQualification = profile.qualifications
      .sort((a: any, b: any) => new Date(b.year).getTime() - new Date(a.year).getTime())[0];
    
    achievements.push({
      title: "Academic Excellence",
      description: `${latestQualification.degree} in ${latestQualification.stream}`,
      date: latestQualification.year,
      type: "certification"
    });
  }
  
  return achievements.slice(0, 5); // Return top 5 achievements
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    const isAdmin = (session.user as any)?.role === "ADMIN";
    
    const userId = (isAdmin && targetUserId) ? targetUserId : session.user.id;
    
    // Load user data
    const profile = loadUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    const appointments = loadUserAppointments(userId);
    const prescriptions = loadUserPrescriptions(userId);
    
    // Calculate statistics
    const totalExperience = calculateTotalExperience(profile.experience || []);
    const totalAppointments = appointments.length;
    const totalPrescriptions = prescriptions.length;
    
    // Calculate revenue (rough estimate)
    const totalRevenue = appointments.reduce((sum, app) => sum + (app.fee || 500), 0);
    
    // Calculate unique patients
    const patientsSeen = new Set(appointments.map(app => app.patientId)).size;
    
    // Calculate availability percentage
    const availabilityPercentage = Math.floor(75 + Math.random() * 20); // Random 75-95%
    
    // Generate monthly stats
    const monthlyStats = generateMonthlyStats(appointments, prescriptions);
    
    // Generate achievements
    const recentAchievements = generateAchievements(profile, {
      totalExperience,
      totalAppointments,
      totalPrescriptions
    });
    
    const stats: ProfileStats = {
      totalExperience,
      totalAppointments,
      totalPrescriptions,
      totalRevenue,
      patientsSeen,
      availabilityPercentage,
      specializations: profile.specializations || [],
      departmentStats: {
        patientsInDepartment: patientsSeen + Math.floor(Math.random() * 50),
        departmentRanking: Math.floor(Math.random() * 10) + 1
      },
      monthlyStats,
      recentAchievements
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile statistics" },
      { status: 500 }
    );
  }
}
