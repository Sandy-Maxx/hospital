import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "./prisma";

// Legacy role type - UNCHANGED
export type LegacyRole = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PATIENT";

// Map legacy roles to new permissions (for unified checking)
const LEGACY_ROLE_PERMISSIONS: Record<LegacyRole, string[]> = {
  ADMIN: [
    "patients.manage", "appointments.manage", "bills.manage", "prescriptions.manage",
    "ipd.manage", "lab.manage", "users.manage", "settings.manage", 
    "reports.manage", "roles.manage", "queue.update", "marketing.manage",
    // New modules
    "imaging.manage", "ot.manage", "pharmacy.manage"
  ],
  DOCTOR: [
    "patients.read", "patients.update", "patients.create",
    "appointments.read", "appointments.update", "appointments.create", "appointments.assign",
    "prescriptions.manage", "queue.read", "queue.update",
    "ipd.read", "ipd.update", "ipd.admit", "ipd.discharge",
    "lab.read", "reports.read",
    // Imaging/OT/Pharmacy access for doctors
    "imaging.read", "imaging.create", "ot.read", "ot.create", "pharmacy.read"
  ],
  NURSE: [
    "patients.read", "patients.update",
    "appointments.read", "appointments.update",
    "prescriptions.read", "queue.read", "queue.update",
    "ipd.read", "ipd.update", "lab.read",
    // Read access for operational modules
    "imaging.read", "ot.read", "pharmacy.read"
  ],
  RECEPTIONIST: [
    "patients.read", "patients.create", "patients.update",
    "appointments.read", "appointments.create", "appointments.update",
    "bills.read", "bills.create", "queue.read",
    // Read access for coordination
    "imaging.read", "ot.read", "pharmacy.read"
  ],
  PATIENT: ["appointments.read"]
};

/**
 * BACKWARD COMPATIBLE: Original withAuth function - UNCHANGED behavior
 * This ensures existing API routes continue working exactly as before
 */
export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[],
): Promise<{ session: any } | NextResponse> {
  let session: any = null;
  try {
    session = await getServerSession(authOptions as any);
  } catch {
    session = null;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // UNCHANGED: Legacy role checking (keeps all existing functionality)
  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}

/**
 * NEW: Enhanced auth that supports both legacy roles AND dynamic permissions
 * Only use this for NEW routes or when explicitly migrating existing ones
 */
export async function withEnhancedAuth(
  request: NextRequest,
  options: {
    // Legacy support - works exactly like withAuth
    requiredRoles?: LegacyRole[];
    // New dynamic permissions - optional
    requiredPermissions?: string[];
    requireAll?: boolean; // Default: false (any permission is enough)
  } = {}
): Promise<{ session: any; permissions: string[] } | NextResponse> {
  let session: any = null;
  try {
    session = await getServerSession(authOptions as any);
  } catch {
    session = null;
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  // STEP 1: Check legacy roles first (backward compatibility)
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    if (!options.requiredRoles.includes(user.role as LegacyRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // STEP 2: Get user's effective permissions (legacy + dynamic)
  let userPermissions: string[] = [];
  
  try {
    // Add legacy role permissions
    const legacyRole = user.role as LegacyRole;
    if (legacyRole && LEGACY_ROLE_PERMISSIONS[legacyRole]) {
      userPermissions = [...LEGACY_ROLE_PERMISSIONS[legacyRole]];
    }

    // Add dynamic role permissions (safe - won't break if DB fails)
    try {
      const customRoles = await prisma.userRole.findMany({
        where: {
          userId: user.id,
          isActive: true
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      // Add custom permissions to user's permission set
      customRoles.forEach(userRole => {
        userRole.role.permissions.forEach(rolePermission => {
          if (rolePermission.permission.isActive) {
            userPermissions.push(rolePermission.permission.name);
          }
        });
      });
    } catch (dbError) {
      // If dynamic permissions fail, continue with legacy permissions only
      console.warn("Dynamic permissions unavailable, using legacy only:", dbError);
    }

  } catch (error) {
    console.error("Permission check error:", error);
    // Fallback to legacy role checking only
    userPermissions = LEGACY_ROLE_PERMISSIONS[user.role as LegacyRole] || [];
  }

  // STEP 3: Check dynamic permissions (optional)
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    const hasPermission = (permission: string): boolean => {
      // Check exact permission
      if (userPermissions.includes(permission)) return true;
      
      // Check module-level "manage" permission
      const [module] = permission.split('.');
      if (userPermissions.includes(`${module}.manage`)) return true;
      
      return false;
    };

    const hasAccess = options.requireAll
      ? options.requiredPermissions.every(hasPermission)
      : options.requiredPermissions.some(hasPermission);

    if (!hasAccess) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
  }

  return { session, permissions: userPermissions };
}

/**
 * Utility: Check if user has specific permission
 * Safe to use - won't break existing functionality
 */
export async function hasPermission(user: any, permission: string): Promise<boolean> {
  try {
    // Get user's effective permissions
    let userPermissions: string[] = [];
    
    // Add legacy permissions
    const legacyRole = user?.role as LegacyRole;
    if (legacyRole && LEGACY_ROLE_PERMISSIONS[legacyRole]) {
      userPermissions = [...LEGACY_ROLE_PERMISSIONS[legacyRole]];
    }

    // Add dynamic permissions (safe)
    try {
      if (user?.id) {
        const customRoles = await prisma.userRole.findMany({
          where: {
            userId: user.id,
            isActive: true
          },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        });

        customRoles.forEach(userRole => {
          userRole.role.permissions.forEach(rolePermission => {
            if (rolePermission.permission.isActive) {
              userPermissions.push(rolePermission.permission.name);
            }
          });
        });
      }
    } catch {
      // Continue with legacy permissions only
    }

    // Check permission
    if (userPermissions.includes(permission)) return true;
    
    // Check module-level "manage" permission
    const [module] = permission.split('.');
    if (userPermissions.includes(`${module}.manage`)) return true;
    
    return false;
    
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * React hook for checking permissions in components
 * Safe to use - provides both legacy and dynamic permission checking
 */
export function usePermissions(user: any) {
  return {
    // New dynamic permission checking
    hasPermission: (permission: string) => hasPermission(user, permission),
    
    // Legacy role checking (unchanged behavior)
    isAdmin: user?.role === 'ADMIN',
    isDoctor: user?.role === 'DOCTOR',
    isNurse: user?.role === 'NURSE',
    isReceptionist: user?.role === 'RECEPTIONIST',
    
    // Helper functions
    canManageUsers: user?.role === 'ADMIN',
    canManageSettings: user?.role === 'ADMIN',
    canViewReports: ['ADMIN', 'DOCTOR'].includes(user?.role),
    canManageBilling: ['ADMIN', 'RECEPTIONIST'].includes(user?.role)
  };
}

/**
 * Migration helper: Convert legacy role arrays to permissions
 */
export function roleArrayToPermissions(roles: LegacyRole[], action: string): string[] {
  const permissions = new Set<string>();
  
  roles.forEach(role => {
    const rolePermissions = LEGACY_ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(perm => {
      if (perm.includes(action)) {
        permissions.add(perm);
      }
    });
  });
  
  return Array.from(permissions);
}

export default {
  withAuth, // Keep original function unchanged
  withEnhancedAuth, // New enhanced function
  hasPermission,
  usePermissions,
  roleArrayToPermissions,
  LEGACY_ROLE_PERMISSIONS
};
