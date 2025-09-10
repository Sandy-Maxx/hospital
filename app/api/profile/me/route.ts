import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const baseDir = path.join(process.cwd(), "data", "user-profiles");

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  try {
    // First try to get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (user) {
      // Start with database user data
      let profileData = {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        fullName: user.name || '',
        email: user.email,
        role: user.role,
        department: user.department || '',
        specialization: user.specialization || '',
        phone: '',
        bio: '',
        profileImage: '',
        experience: [],
        availability: {},
        qualifications: [],
        designation: {},
      };
      
      // Try to merge with file system data if available
      const file = path.join(baseDir, `${session.user.id}.json`);
      if (fs.existsSync(file)) {
        try {
          const fileData = JSON.parse(fs.readFileSync(file, "utf8"));
          profileData = { ...profileData, ...fileData };
          // Ensure database data takes precedence for key fields
          profileData.fullName = user.name || profileData.fullName;
          profileData.email = user.email;
          profileData.role = user.role;
          profileData.department = user.department || profileData.department;
          profileData.specialization = user.specialization || profileData.specialization;
        } catch (error) {
          console.warn('Failed to parse file profile data:', error);
        }
      }
      
      return NextResponse.json(profileData);
    }
    
    // Fallback to file system if user not found in database
    const file = path.join(baseDir, `${session.user.id}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      return NextResponse.json(data);
    }
    
    return NextResponse.json({});
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({}, { status: 500 });
  }
}

// Function to synchronize user data across all systems
const syncUserDataAcrossSystem = async (userId: string, updates: any) => {
  const dataDir = path.join(process.cwd(), "data");
  
  // If name or phone changed, update related records
  const hasNameChange = updates.firstName || updates.lastName || updates.fullName;
  const hasPhoneChange = updates.phone || updates.mobile;
  
  if (hasNameChange || hasPhoneChange) {
    // Update appointments
    try {
      const appointmentsFile = path.join(dataDir, "appointments.json");
      if (fs.existsSync(appointmentsFile)) {
        const appointments = JSON.parse(fs.readFileSync(appointmentsFile, "utf8"));
        let updated = false;
        appointments.forEach((apt: any) => {
          if (apt.doctorId === userId || apt.patientId === userId) {
            if (hasNameChange) {
              if (apt.doctorId === userId) {
                apt.doctorName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
              if (apt.patientId === userId) {
                apt.patientName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
            }
            if (hasPhoneChange && apt.patientId === userId) {
              apt.patientPhone = updates.phone || updates.mobile;
            }
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(appointmentsFile, JSON.stringify(appointments, null, 2));
        }
      }
    } catch (error) {
      console.warn('Failed to sync appointments:', error);
    }
    
    // Update prescriptions
    try {
      const prescriptionsFile = path.join(dataDir, "prescriptions.json");
      if (fs.existsSync(prescriptionsFile)) {
        const prescriptions = JSON.parse(fs.readFileSync(prescriptionsFile, "utf8"));
        let updated = false;
        prescriptions.forEach((presc: any) => {
          if (presc.doctorId === userId || presc.patientId === userId) {
            if (hasNameChange) {
              if (presc.doctorId === userId) {
                presc.doctorName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
              if (presc.patientId === userId) {
                presc.patientName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
            }
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(prescriptionsFile, JSON.stringify(prescriptions, null, 2));
        }
      }
    } catch (error) {
      console.warn('Failed to sync prescriptions:', error);
    }
    
    // Update bills
    try {
      const billsFile = path.join(dataDir, "bills.json");
      if (fs.existsSync(billsFile)) {
        const bills = JSON.parse(fs.readFileSync(billsFile, "utf8"));
        let updated = false;
        bills.forEach((bill: any) => {
          if (bill.doctorId === userId || bill.patientId === userId) {
            if (hasNameChange) {
              if (bill.doctorId === userId) {
                bill.doctorName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
              if (bill.patientId === userId) {
                bill.patientName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
            }
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(billsFile, JSON.stringify(bills, null, 2));
        }
      }
    } catch (error) {
      console.warn('Failed to sync bills:', error);
    }
    
    // Update SOAP notes and medical records
    try {
      const soapFile = path.join(dataDir, "soap-notes.json");
      if (fs.existsSync(soapFile)) {
        const soapNotes = JSON.parse(fs.readFileSync(soapFile, "utf8"));
        let updated = false;
        soapNotes.forEach((soap: any) => {
          if (soap.doctorId === userId || soap.patientId === userId) {
            if (hasNameChange) {
              if (soap.doctorId === userId) {
                soap.doctorName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
              if (soap.patientId === userId) {
                soap.patientName = updates.fullName || `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
              }
            }
            updated = true;
          }
        });
        if (updated) {
          fs.writeFileSync(soapFile, JSON.stringify(soapNotes, null, 2));
        }
      }
    } catch (error) {
      console.warn('Failed to sync SOAP notes:', error);
    }
  }
};

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  ensureDir(baseDir);
  const file = path.join(baseDir, `${session.user.id}.json`);

  const readExisting = () => {
    try {
      return fs.existsSync(file)
        ? JSON.parse(fs.readFileSync(file, "utf8"))
        : {};
    } catch {
      return {};
    }
  };
  
  const writeAudit = (before: any, after: any) => {
    try {
      const afile = path.join(process.cwd(), "data", "audit-logs.json");
      const dir = path.dirname(afile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const list = fs.existsSync(afile)
        ? JSON.parse(fs.readFileSync(afile, "utf8"))
        : [];
      const changedKeys = Array.from(
        new Set([...Object.keys(before || {}), ...Object.keys(after || {})]),
      ).filter(
        (k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]),
      );
      list.push({
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        actorId: session.user.id,
        targetUserId: session.user.id,
        action: "PROFILE_UPDATE",
        changedKeys,
        at: new Date().toISOString(),
      });
      fs.writeFileSync(afile, JSON.stringify(list, null, 2), "utf8");
    } catch {}
  };

  // Admin can update everything; non-admin can update limited fields only
  const isAdmin = (session.user as any)?.role === "ADMIN";
  if (!isAdmin) {
    const allowed = ["firstName", "lastName", "fullName", "phone", "mobile", "address", "bio", "profileImage"];
    const existing: any = readExisting();
    const merged: any = { ...existing };
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) merged[k] = body[k];
    }
    
    // Sync changes across system
    await syncUserDataAcrossSystem(session.user.id, merged);
    
    writeAudit(existing, merged);
    fs.writeFileSync(file, JSON.stringify(merged, null, 2), "utf8");
    return NextResponse.json({ success: true });
  }

  const before = readExisting();
  
  // Sync changes across system for admin updates too
  await syncUserDataAcrossSystem(session.user.id, body);
  
  fs.writeFileSync(file, JSON.stringify(body, null, 2), "utf8");
  writeAudit(before, body);
  return NextResponse.json({ success: true });
}
