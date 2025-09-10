import { format } from "date-fns";

interface WeeklySchedule {
  [key: string]: {
    isOpen: boolean;
    startTime: string;
    endTime: string;
  };
}

interface HospitalSettings {
  weeklySchedule: WeeklySchedule;
}

let cachedSettings: HospitalSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch hospital settings from the API with caching
 */
async function getHospitalSettings(): Promise<HospitalSettings | null> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings;
  }
  
  try {
    const response = await fetch('/api/settings/hospital');
    if (response.ok) {
      const settings = await response.json();
      cachedSettings = settings;
      lastFetchTime = now;
      return settings;
    }
  } catch (error) {
    console.error('Failed to fetch hospital settings:', error);
  }
  
  return null;
}

/**
 * Get the day of week key from a date
 */
function getDayOfWeekKey(date: Date): string {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[date.getDay()];
}

/**
 * Check if the hospital is open on a specific date
 */
export async function isHospitalOpenOnDate(date: Date | string): Promise<boolean> {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayKey = getDayOfWeekKey(dateObj);
  
  const settings = await getHospitalSettings();
  if (!settings || !settings.weeklySchedule) {
    // If settings not available, assume open (fallback)
    return true;
  }
  
  const daySchedule = settings.weeklySchedule[dayKey];
  return daySchedule?.isOpen || false;
}

/**
 * Get hospital operating hours for a specific date
 */
export async function getHospitalHoursForDate(date: Date | string): Promise<{ startTime: string; endTime: string } | null> {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayKey = getDayOfWeekKey(dateObj);
  
  const settings = await getHospitalSettings();
  if (!settings || !settings.weeklySchedule) {
    return null;
  }
  
  const daySchedule = settings.weeklySchedule[dayKey];
  if (daySchedule?.isOpen) {
    return {
      startTime: daySchedule.startTime,
      endTime: daySchedule.endTime
    };
  }
  
  return null;
}

/**
 * Get all closed dates for a date range (useful for calendar components)
 */
export async function getClosedDatesInRange(startDate: Date, endDate: Date): Promise<string[]> {
  const closedDates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const isOpen = await isHospitalOpenOnDate(currentDate);
    if (!isOpen) {
      closedDates.push(format(currentDate, 'yyyy-MM-dd'));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return closedDates;
}

/**
 * Check if a date string is a closed day (for HTML date inputs)
 */
export async function isClosedDay(dateString: string): Promise<boolean> {
  const isOpen = await isHospitalOpenOnDate(dateString);
  return !isOpen;
}

/**
 * Get the next available open date from a given date
 */
export async function getNextOpenDate(fromDate: Date = new Date()): Promise<Date> {
  const currentDate = new Date(fromDate);
  let attempts = 0;
  const maxAttempts = 14; // Check up to 2 weeks ahead
  
  while (attempts < maxAttempts) {
    const isOpen = await isHospitalOpenOnDate(currentDate);
    if (isOpen) {
      return currentDate;
    }
    currentDate.setDate(currentDate.getDate() + 1);
    attempts++;
  }
  
  // Fallback: return the original date if no open day found within 2 weeks
  return fromDate;
}

/**
 * Validate if an appointment date is allowed
 */
export async function validateAppointmentDate(dateString: string): Promise<{ valid: boolean; message?: string }> {
  const appointmentDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);
  
  // Check if date is in the past
  if (appointmentDate < today) {
    return {
      valid: false,
      message: 'Cannot book appointments for past dates'
    };
  }
  
  // Check if hospital is open on this day
  const isOpen = await isHospitalOpenOnDate(appointmentDate);
  if (!isOpen) {
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      valid: false,
      message: `Hospital is closed on ${dayName}s. Please select a different date.`
    };
  }
  
  return { valid: true };
}

/**
 * Clear the settings cache (useful for testing or when settings change)
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
  lastFetchTime = 0;
}
