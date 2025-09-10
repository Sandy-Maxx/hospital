export interface ProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  department?: string;
  designation?: {
    current?: string;
    changelog?: Array<{
      designation: string;
      fromYear: number;
      toYear?: number;
    }>;
  };
  jobDescription?: string;
  responsibilities?: string;
  specializations?: string[];
  qualifications?: Array<{
    degree: string;
    stream: string;
    institute?: string;
    year?: number;
  }>;
  experience?: Array<{
    organization: string;
    designation: string;
    department?: string;
    fromYear: number;
    toYear?: number;
    notes?: string;
  }>;
  availabilityRules?: Array<{
    id: string;
    type: "UNAVAILABLE" | "LEAVE" | "HOLIDAY" | "CUSTOM";
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    weekdays?: number[];
    reason?: string;
    isRecurring: boolean;
    isActive: boolean;
  }>;
  profileCard?: {
    layout: "compact" | "detailed" | "minimal";
    showStats: boolean;
    showSpecializations: boolean;
    showExperience: boolean;
    backgroundColor: string;
    textColor: string;
  };
}

export interface UserStatistics {
  totalPrescriptions?: number;
  totalRevenue?: number;
  totalPatients?: number;
  averageRating?: number;
  completedAppointments?: number;
  pendingAppointments?: number;
}

export interface TimelineEvent {
  id: string;
  type: "designation_change" | "experience" | "qualification" | "milestone";
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  organization?: string;
  location?: string;
  isActive: boolean;
}
