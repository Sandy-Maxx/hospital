import { User } from "next-auth";

export type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PATIENT";

export interface Permission {
  canEditBasicInfo: boolean;
  canEditProfessionalDetails: boolean;
  canEditQualifications: boolean;
  canEditExperience: boolean;
  canEditSpecializations: boolean;
  canEditAvailability: boolean;
  canViewFinancialData: boolean;
  canEditOtherUsers: boolean;
  canDeleteProfile: boolean;
  canManageRoles: boolean;
}

export const DEFAULT_PERMISSIONS: Record<Role, Permission> = {
  ADMIN: {
    canEditBasicInfo: true,
    canEditProfessionalDetails: true,
    canEditQualifications: true,
    canEditExperience: true,
    canEditSpecializations: true,
    canEditAvailability: true,
    canViewFinancialData: true,
    canEditOtherUsers: true,
    canDeleteProfile: true,
    canManageRoles: true,
  },
  DOCTOR: {
    canEditBasicInfo: true,
    canEditProfessionalDetails: false, // Only admin can change department/designation
    canEditQualifications: true,
    canEditExperience: true,
    canEditSpecializations: true,
    canEditAvailability: true,
    canViewFinancialData: false,
    canEditOtherUsers: false,
    canDeleteProfile: false,
    canManageRoles: false,
  },
  NURSE: {
    canEditBasicInfo: true,
    canEditProfessionalDetails: false,
    canEditQualifications: true,
    canEditExperience: true,
    canEditSpecializations: false,
    canEditAvailability: true,
    canViewFinancialData: false,
    canEditOtherUsers: false,
    canDeleteProfile: false,
    canManageRoles: false,
  },
  RECEPTIONIST: {
    canEditBasicInfo: true,
    canEditProfessionalDetails: false,
    canEditQualifications: false,
    canEditExperience: false,
    canEditSpecializations: false,
    canEditAvailability: false,
    canViewFinancialData: false,
    canEditOtherUsers: false,
    canDeleteProfile: false,
    canManageRoles: false,
  },
  PATIENT: {
    canEditBasicInfo: true,
    canEditProfessionalDetails: false,
    canEditQualifications: false,
    canEditExperience: false,
    canEditSpecializations: false,
    canEditAvailability: false,
    canViewFinancialData: false,
    canEditOtherUsers: false,
    canDeleteProfile: false,
    canManageRoles: false,
  },
};

export function getUserPermissions(user: User | any): Permission {
  const role = (user?.role || "PATIENT") as Role;
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.PATIENT;
}

export function canUserEditField(user: User | any, field: keyof Permission): boolean {
  const permissions = getUserPermissions(user);
  return permissions[field];
}

export function canUserEditProfile(user: User | any, targetUserId?: string): boolean {
  // Users can always edit their own profile (within their permission limits)
  if (!targetUserId || user?.id === targetUserId) {
    return true;
  }
  
  // Only admins can edit other users' profiles
  const permissions = getUserPermissions(user);
  return permissions.canEditOtherUsers;
}

export function getEditableFields(user: User | any, isOwnProfile: boolean = true): string[] {
  const permissions = getUserPermissions(user);
  const fields: string[] = [];
  
  if (permissions.canEditBasicInfo) {
    fields.push("firstName", "lastName", "email", "phone", "bio", "profileImage");
  }
  
  if (permissions.canEditProfessionalDetails && (isOwnProfile || permissions.canEditOtherUsers)) {
    fields.push("department", "designation", "employeeId");
  }
  
  if (permissions.canEditQualifications) {
    fields.push("qualifications");
  }
  
  if (permissions.canEditExperience) {
    fields.push("experience");
  }
  
  if (permissions.canEditSpecializations) {
    fields.push("specializations");
  }
  
  if (permissions.canEditAvailability) {
    fields.push("availability");
  }
  
  return fields;
}

export function filterProfileDataForRole(profileData: any, user: User | any, isOwnProfile: boolean = true): any {
  const permissions = getUserPermissions(user);
  const filteredData = { ...profileData };
  
  if (!permissions.canViewFinancialData && !isOwnProfile) {
    delete filteredData.salary;
    delete filteredData.revenue;
    delete filteredData.prescriptionCount;
  }
  
  if (!permissions.canEditOtherUsers && !isOwnProfile) {
    // Remove sensitive fields when viewing others' profiles
    delete filteredData.email;
    delete filteredData.phone;
    delete filteredData.employeeId;
  }
  
  return filteredData;
}

export function validateProfileUpdate(
  updateData: any, 
  user: User | any, 
  targetUserId?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const isOwnProfile = !targetUserId || user?.id === targetUserId;
  const permissions = getUserPermissions(user);
  
  // Check if user can edit this profile
  if (!canUserEditProfile(user, targetUserId)) {
    errors.push("You don't have permission to edit this profile");
    return { isValid: false, errors };
  }
  
  // Check individual field permissions
  if (updateData.department !== undefined || updateData.designation !== undefined) {
    if (!permissions.canEditProfessionalDetails || (!isOwnProfile && !permissions.canEditOtherUsers)) {
      errors.push("You don't have permission to edit professional details");
    }
  }
  
  if (updateData.qualifications !== undefined && !permissions.canEditQualifications) {
    errors.push("You don't have permission to edit qualifications");
  }
  
  if (updateData.experience !== undefined && !permissions.canEditExperience) {
    errors.push("You don't have permission to edit experience");
  }
  
  if (updateData.specializations !== undefined && !permissions.canEditSpecializations) {
    errors.push("You don't have permission to edit specializations");
  }
  
  if (updateData.availability !== undefined && !permissions.canEditAvailability) {
    errors.push("You don't have permission to edit availability");
  }
  
  return { isValid: errors.length === 0, errors };
}

export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    ADMIN: "Administrator",
    DOCTOR: "Doctor",
    NURSE: "Nurse",
    RECEPTIONIST: "Receptionist",
    PATIENT: "Patient",
  };
  
  return roleNames[role] || "User";
}

export function canUserAccessPage(user: User | any, page: string): boolean {
  const permissions = getUserPermissions(user);
  
  switch (page) {
    case "admin-dashboard":
      return permissions.canManageRoles;
    case "user-management":
      return permissions.canEditOtherUsers;
    case "financial-reports":
      return permissions.canViewFinancialData;
    case "profile-edit":
      return permissions.canEditBasicInfo;
    default:
      return true; // Allow access to general pages
  }
}
