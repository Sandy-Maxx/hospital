import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Force dynamic behavior for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const profilesDir = path.join(process.cwd(), "data", "user-profiles");

interface PublicProfile {
  id: string;
  firstName: string;
  lastName: string;
  designation: {
    current: string;
  };
  department: string;
  specializations: string[];
  profileImage?: string;
  bio?: string;
  qualifications: Array<{
    degree: string;
    stream: string;
    institute: string;
    year: string;
  }>;
  totalExperience: number;
  isAvailable?: boolean;
  publicCard?: {
    published: boolean;
    shape: 'round' | 'rectangle';
    cardUrl?: string;
    updatedAt?: string;
  };
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
  
  return Math.floor(totalMonths / 12); // Return years
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
    console.error(`Error loading profile for user ${userId}:`, error);
    return null;
  }
}

function getAllUserProfiles(): string[] {
  if (!fs.existsSync(profilesDir)) {
    return [];
  }
  
  return fs.readdirSync(profilesDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

function filterForPublicDisplay(profile: any): PublicProfile | null {
  if (!profile || !profile.firstName || !profile.lastName) {
    return null;
  }
  
  // Only show staff members (doctors, nurses, etc.) - not patients
  const staffRoles = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'];
  if (!staffRoles.includes(profile.role)) {
    return null;
  }
  
  // Only show profiles with published cards
  if (!profile.publicCard?.published) {
    return null;
  }
  
  // Calculate total experience
  const totalExperience = calculateTotalExperience(profile.experience || []);
  
  return {
    id: profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    designation: {
      current: profile.designation?.current || 'Staff Member',
    },
    department: profile.department || 'General',
    specializations: profile.specializations || [],
    profileImage: profile.profileImage,
    bio: profile.bio,
    qualifications: profile.qualifications || [],
    totalExperience,
    isAvailable: profile.isAvailable,
    publicCard: {
      published: profile.publicCard.published,
      shape: profile.publicCard.shape || 'rectangle',
      cardUrl: `/team-cards/${profile.id}-${profile.publicCard.shape || 'rectangle'}.png`,
      updatedAt: profile.publicCard.updatedAt
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const availability = searchParams.get('availability');
    
    const userIds = getAllUserProfiles();
    const publicProfiles: PublicProfile[] = [];
    
    for (const userId of userIds) {
      const profile = loadUserProfile(userId);
      const publicProfile = filterForPublicDisplay(profile);
      
      if (publicProfile) {
        // Apply filters
        if (department && publicProfile.department.toLowerCase() !== department.toLowerCase()) {
          continue;
        }
        
        if (role && !publicProfile.designation.current.toLowerCase().includes(role.toLowerCase())) {
          continue;
        }
        
        if (availability === 'true' && !publicProfile.isAvailable) {
          continue;
        }
        
        publicProfiles.push(publicProfile);
      }
    }
    
    // Sort by designation hierarchy and then by name
    const designationOrder = [
      'Chief Medical Officer',
      'Head of Department',
      'Consultant',
      'Senior Doctor',
      'Junior Doctor',
      'Head Nurse',
      'Nursing Supervisor',
      'Nurse',
      'Administrator',
      'IT Administrator',
      'Receptionist',
    ];
    
    publicProfiles.sort((a, b) => {
      const aOrder = designationOrder.indexOf(a.designation.current);
      const bOrder = designationOrder.indexOf(b.designation.current);
      
      // If designation not found in order, put at end
      const aIndex = aOrder === -1 ? designationOrder.length : aOrder;
      const bIndex = bOrder === -1 ? designationOrder.length : bOrder;
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      
      // If same designation, sort by name
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
    
    return NextResponse.json({
      team: publicProfiles,
      total: publicProfiles.length,
      filters: {
        departments: Array.from(new Set(publicProfiles.map(p => p.department))),
        designations: Array.from(new Set(publicProfiles.map(p => p.designation.current))),
      }
    });
    
  } catch (error) {
    console.error("Error fetching team profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch team profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, shape } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const profile = loadUserProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }
    
    if (action === 'publish') {
      // Publish the card to team page
      profile.publicCard = {
        ...profile.publicCard,
        published: true,
        shape: shape || 'rectangle',
        updatedAt: new Date().toISOString()
      };
    } else if (action === 'unpublish') {
      // Remove from team page
      profile.publicCard = {
        ...profile.publicCard,
        published: false,
        updatedAt: new Date().toISOString()
      };
    }
    
    // Save updated profile
    const filePath = path.join(profilesDir, `${userId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Error updating public card settings:", error);
    return NextResponse.json(
      { error: "Failed to update public card settings" },
      { status: 500 }
    );
  }
}
