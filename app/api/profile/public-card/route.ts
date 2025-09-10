import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const profilesDir = path.join(process.cwd(), "data", "user-profiles");
const cardsDir = path.join(process.cwd(), "public", "team-cards");

// Ensure cards directory exists
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
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

function calculateTotalExperience(profile: any): number {
  if (!profile?.experience?.length && !profile?.designation?.changelog?.length) {
    return 0;
  }

  const currentYear = new Date().getFullYear();
  let totalMonths = 0;

  // Calculate from experience entries
  profile?.experience?.forEach((exp: any) => {
    const startYear = exp.fromYear;
    const endYear = exp.toYear || currentYear;
    totalMonths += (endYear - startYear) * 12;
  });

  // Calculate from designation changelog
  profile?.designation?.changelog?.forEach((change: any) => {
    const startYear = change.fromYear;
    const endYear = change.toYear || currentYear;
    totalMonths += (endYear - startYear) * 12;
  });

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
}

function getHighestQualification(qualifications: any[]): string {
  if (!qualifications || qualifications.length === 0) return "";
  
  const degreeHierarchy = ["PhD", "MD", "MS", "MSc", "MPharm", "MTech", "MBBS", "BPharm", "BTech", "BSc", "Diploma", "High School"];
  
  let highest = qualifications[0];
  qualifications.forEach(qual => {
    const currentIndex = degreeHierarchy.indexOf(qual.degree);
    const highestIndex = degreeHierarchy.indexOf(highest.degree);
    
    if (currentIndex !== -1 && (highestIndex === -1 || currentIndex < highestIndex)) {
      highest = qual;
    }
  });
  
  return `${highest.degree}${highest.stream ? ` in ${highest.stream}` : ''}`;
}

function getDepartmentIcon(department: string): string {
  const icons: Record<string, string> = {
    Cardiology: "❤️",
    Neurology: "🧠", 
    Orthopedics: "🦴",
    Pediatrics: "👶",
    Emergency: "🚨",
    Radiology: "🔬",
    Surgery: "✂️",
    Oncology: "🎗️",
    Psychiatry: "🧘",
    Dermatology: "🌟",
    "General Medicine": "🩺",
    "Obstetrics & Gynecology": "🤱",
    Administration: "⚙️",
    IT: "💻",
    General: "🏥"
  };
  
  return icons[department] || "🏥";
}

async function generateCardHTML(profile: any, customImagePosition?: any): Promise<string> {
  const totalExp = calculateTotalExperience(profile);
  const highestQual = getHighestQualification(profile.qualifications || []);
  // Use full URL for images to work in iframe preview
  const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
  const profileImageUrl = profile.profileImage 
    ? (profile.profileImage.startsWith('http') ? profile.profileImage : baseUrl + profile.profileImage)
    : baseUrl + '/default-avatar.svg';
  const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  
  // Handle both old string format and new coordinate format
  let imagePosition = 'center';
  if (customImagePosition && typeof customImagePosition === 'object' && customImagePosition.x !== undefined && customImagePosition.y !== undefined) {
    // New coordinate-based positioning
    imagePosition = `${customImagePosition.x}% ${customImagePosition.y}%`;
  } else if (profile.publicCard?.imagePosition) {
    // Legacy string positioning
    imagePosition = profile.publicCard.imagePosition;
  }
  
  const cardStyle = {
    width: '320px',
    height: '380px',
    borderRadius: '12px'
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        background: #f5f5f5;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
        margin: 0;
      }
      
      .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        width: ${cardStyle.width};
        height: ${cardStyle.height};
        border-radius: ${cardStyle.borderRadius};
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .image-container {
        height: 200px;
        overflow: hidden;
        background: #f8fafc;
        border-bottom: 1px solid #f1f5f9;
      }
      
      .profile-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: ${imagePosition};
      }
      
      .info-area {
        background: #ffffff;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
      }
      
      .header-info {
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 6px;
      }
      
      .name-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      
      .name {
        font-size: 14px;
        font-weight: 700;
        color: #111827;
        letter-spacing: -0.2px;
        line-height: 1.1;
      }
      
      .designation {
        font-size: 10px;
        font-weight: 600;
        color: #3b82f6;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      
      .department-section {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 6px;
      }
      
      .department-badge {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 9px;
        font-weight: 500;
        color: #374151;
      }
      
      .info-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        row-gap: 2px;
      }
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 0;
      }
      
      .info-icon {
        font-size: 11px;
        width: 12px;
        text-align: center;
        flex-shrink: 0;
      }
      
      .info-text {
        font-size: 8px;
        color: #4b5563;
        font-weight: 400;
        line-height: 1.1;
        min-width: 40px;
      }
      
      .info-value {
        font-size: 8px;
        color: #111827;
        font-weight: 600;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .hospital-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.95);
        color: #374151;
        padding: 6px 10px;
        border-radius: 12px;
        font-size: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(4px);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="hospital-badge">Our Team</div>
      
      <div class="image-container">
        <img class="profile-image" src="${profileImageUrl}" alt="Profile" onerror="this.src='${baseUrl}/default-avatar.svg'" />
      </div>
      
      <div class="info-area">
        <div class="header-info">
          <div class="name-section">
            <div class="name">${fullName || 'Staff Member'}</div>
            <div class="designation">${profile.designation?.current || 'Staff'}</div>
          </div>
          <div class="department-section">
            <div class="department-badge">
              <span>${getDepartmentIcon(profile.department || 'General')}</span>
              <span>${profile.department || 'General'}</span>
            </div>
          </div>
        </div>
        
        <div class="info-section">
          ${totalExp > 0 ? `
            <div class="info-item">
              <span class="info-icon">⏱️</span>
              <span class="info-text">Experience:</span>
              <span class="info-value">${totalExp} years</span>
            </div>
          ` : ''}
          
          ${profile.specializations && profile.specializations.length > 0 ? `
            <div class="info-item">
              <span class="info-icon">⭐</span>
              <span class="info-text">Specialty:</span>
              <span class="info-value">${profile.specializations[0]}</span>
            </div>
          ` : ''}
          
          ${profile.qualifications && profile.qualifications.length > 0 ? `
            <div class="info-item">
              <span class="info-icon">🎓</span>
              <span class="info-text">Degree:</span>
              <span class="info-value">${profile.qualifications[profile.qualifications.length - 1].degree}</span>
            </div>
          ` : ''}
          
          ${profile.email ? `
            <div class="info-item">
              <span class="info-icon">✉️</span>
              <span class="info-text">Email:</span>
              <span class="info-value">${profile.email}</span>
            </div>
          ` : ''}
          
          ${profile.specializations && profile.specializations.length > 1 ? `
            <div class="info-item">
              <span class="info-icon">🛠️</span>
              <span class="info-text">Skills:</span>
              <span class="info-value">${profile.specializations.slice(1, 2).join(', ')}</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, publish = false, imagePosition } = body;
    
    // Only allow users to generate their own cards or admins to generate any
    const isAdmin = (session.user as any)?.role === "ADMIN";
    const targetUserId = (isAdmin && userId) ? userId : session.user.id;
    
    const profile = loadUserProfile(targetUserId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Update profile with image position preference
    if (!profile.publicCard) {
      profile.publicCard = {};
    }
    
    // Store the position data (could be string or object)
    if (imagePosition) {
      profile.publicCard.imagePosition = imagePosition;
      
      // Save the updated profile with image position
      const profileFile = path.join(profilesDir, `${targetUserId}.json`);
      fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));
    }
    
    // Only show staff members on public team page
    // If no role is specified, assume they are staff if they have a designation
    const staffRoles = ['DOCTOR', 'NURSE', 'RECEPTIONIST', 'ADMIN'];
    const hasStaffDesignation = profile.designation?.current && 
      ['Doctor', 'Senior Doctor', 'Junior Doctor', 'Consultant', 'Head of Department', 'Chief Medical Officer', 
       'Nurse', 'Head Nurse', 'Nursing Supervisor', 'Administrator', 'IT Administrator', 'Receptionist'].includes(profile.designation.current);
    
    if (profile.role && !staffRoles.includes(profile.role) && !hasStaffDesignation) {
      return NextResponse.json({ error: "Only staff members can have public cards" }, { status: 403 });
    }
    
    // Generate HTML for the card
    const cardHTML = await generateCardHTML(profile, imagePosition);
    
    // For now, we'll return the HTML and card data
    // In a real implementation, you'd use a service like Puppeteer to generate actual PNG
    const cardData = {
      userId: targetUserId,
      published: publish,
      generatedAt: new Date().toISOString(),
      htmlContent: cardHTML,
      // This would be the actual PNG URL in a real implementation
      imageUrl: `/team-cards/${targetUserId}.png`
    };
    
    // Save card metadata
    const cardMetaFile = path.join(cardsDir, `${targetUserId}.json`);
    fs.writeFileSync(cardMetaFile, JSON.stringify(cardData, null, 2));
    
    // Update profile with published status
    if (publish) {
      profile.publicCard = {
        ...profile.publicCard,
        published: true,
        updatedAt: new Date().toISOString()
      };
      
      const profileFile = path.join(profilesDir, `${targetUserId}.json`);
      fs.writeFileSync(profileFile, JSON.stringify(profile, null, 2));
    }
    
    return NextResponse.json({
      success: true,
      cardUrl: cardData.imageUrl,
      previewHtml: cardHTML,
      published: publish
    });
    
  } catch (error) {
    console.error("Error generating public card:", error);
    return NextResponse.json(
      { error: "Failed to generate public card" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const cardMetaFile = path.join(cardsDir, `${userId}.json`);
    if (fs.existsSync(cardMetaFile)) {
      const cardData = JSON.parse(fs.readFileSync(cardMetaFile, "utf-8"));
      return NextResponse.json(cardData);
    }
    
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
    
  } catch (error) {
    console.error("Error fetching card data:", error);
    return NextResponse.json(
      { error: "Failed to fetch card data" },
      { status: 500 }
    );
  }
}
