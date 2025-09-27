export type Edition = "BASIC" | "ADVANCED" | "ENTERPRISE";

export type Feature =
  | "dashboard"
  | "patients"
  | "appointments"
  | "queue"
  | "prescriptions"
  | "billing.basic"
  | "reports.basic"
  | "admin"
  | "settings"
  | "users"
  | "doctorAvailability"
  | "doctorQr"
  | "ipd"
  | "lab"
  | "imaging"
  | "ot"
  | "pharmacy"
  | "pharmacy.queue"
  | "reports.advanced"
  | "marketing"
  | "roles"
  | "permissions"
  | "auditLogs"
  | "offline"
  | "sse"
  | "multiLocation";

const DEFAULT_ENTITLEMENTS: Record<Edition, Feature[]> = {
  BASIC: [
    "dashboard",
    "patients",
    "appointments",
    "queue",
    "prescriptions",
    "billing.basic",
    "reports.basic",
    "admin",
    "settings",
    "users",
    "doctorAvailability",
  ],
  ADVANCED: [
    "dashboard",
    "patients",
    "appointments",
    "queue",
    "prescriptions",
    "billing.basic",
    "reports.basic",
    "reports.advanced",
    "admin",
    "settings",
    "users",
    "doctorAvailability",
    "ipd",
    "lab",
    "imaging",
    "ot",
    "pharmacy",
    "pharmacy.queue",
    "roles",
    "permissions",
    "sse",
  ],
  ENTERPRISE: [
    "dashboard",
    "patients",
    "appointments",
    "queue",
    "prescriptions",
    "billing.basic",
    "reports.basic",
    "reports.advanced",
    "admin",
    "settings",
    "users",
    "doctorAvailability",
    "doctorQr",
    "ipd",
    "lab",
    "imaging",
    "ot",
    "pharmacy",
    "pharmacy.queue",
    "roles",
    "permissions",
    "auditLogs",
    "offline",
    "sse",
    "multiLocation",
    "marketing",
  ],
};

function getEnvEdition(): Edition {
  // Always try to read from API first on client side to get latest edition
  if (typeof window !== 'undefined') {
    // On client side, we should fetch from API, but for now return cached or default
    // The fetchCurrentEdition function handles the API call
    const fromClient = process.env.NEXT_PUBLIC_HOSPITAL_EDITION as Edition | undefined;
    return (fromClient || "ENTERPRISE").toUpperCase() as Edition;
  }
  
  // Server side - read from file system
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(process.cwd(), 'data', 'hospital-settings.json');
    
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      if (settings.currentEdition) {
        const edition = settings.currentEdition.toUpperCase() as Edition;
        if (edition === "BASIC" || edition === "ADVANCED" || edition === "ENTERPRISE") return edition;
      }
    }
  } catch (error) {
    console.error('Error reading hospital settings for edition:', error);
  }
  
  // Fallback to environment variables
  const fromServer = process.env.HOSPITAL_EDITION as Edition | undefined;
  const edition = (fromServer || "ENTERPRISE").toUpperCase() as Edition;
  if (edition === "BASIC" || edition === "ADVANCED" || edition === "ENTERPRISE") return edition;
  return "ENTERPRISE";
}

// Function to update the edition via API
export async function updateEdition(newEdition: Edition): Promise<boolean> {
  try {
    const response = await fetch('/api/editions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ edition: newEdition }),
    });
    
    if (response.ok) {
      const data = await response.json();
      cachedEdition = data.edition;
      cachedEntitlements = null; // Reset cache to force recalculation
      return true;
    } else {
      const errorData = await response.json();
      console.error("Failed to update edition:", errorData.error);
      return false;
    }
  } catch (error) {
    console.error("Failed to update edition:", error);
    return false;
  }
}

// Optional override via server-only entitlements (comma separated)
function getEnvEntitlementsOverride(): Feature[] | null {
  const raw = process.env.HOSPITAL_ENTITLEMENTS;
  if (!raw) return null;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Feature[];
}

let cachedEdition: Edition | null = null;
let cachedEntitlements: Set<Feature> | null = null;

export function getEdition(): Edition {
  if (!cachedEdition) cachedEdition = getEnvEdition();
  return cachedEdition;
}

// Force set edition (used when API returns different value)
export function setEdition(edition: Edition) {
  cachedEdition = edition;
  cachedEntitlements = null; // Clear entitlements cache
}

// Force refresh the edition cache
export function refreshEditionCache() {
  cachedEdition = null;
  cachedEntitlements = null;
}

// Client-side function to fetch edition from API
export async function fetchCurrentEdition(): Promise<Edition> {
  try {
    const response = await fetch('/api/editions', {
      cache: 'no-store', // Ensure we always get fresh data
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    if (response.ok) {
      const data = await response.json();
      // Force update the cached edition
      setEdition(data.edition);
      
      // Trigger a global event for components to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('edition-changed', { 
          detail: { edition: data.edition } 
        }));
      }
      
      return data.edition;
    }
  } catch (error) {
    console.error('Failed to fetch edition from API:', error);
  }
  
  // Fallback to environment-based edition
  return getEdition();
}

export function getEntitlements(): Set<Feature> {
  if (!cachedEntitlements) {
    const ed = getEdition();
    const override = getEnvEntitlementsOverride();
    const list = override && override.length > 0 ? override : DEFAULT_ENTITLEMENTS[ed];
    cachedEntitlements = new Set(list);
  }
  return cachedEntitlements!;
}

export function hasFeature(feature: Feature): boolean {
  try {
    const entitlements = getEntitlements();
    return entitlements.has(feature);
  } catch (error) {
    console.error('Error checking feature:', feature, error);
    // For debugging, let's see what's happening
    console.log('Current edition:', getEdition());
    console.log('Available entitlements:', Array.from(getEntitlements() || []));
    // Return false on error to be more conservative with feature access
    return false;
  }
}

// Optional: map common routes to features for lightweight UI gating
export function featureForPath(path: string): Feature | null {
  const map: Record<string, Feature> = {
    "/dashboard": "dashboard",
    "/patients": "patients",
    "/appointments": "appointments",
    "/queue": "queue",
    "/prescriptions": "prescriptions",
    "/billing": "billing.basic",
    "/reports": "reports.basic",
    "/reports/ot-imaging": "reports.advanced",
    "/admin": "admin",
    "/admin/settings": "settings",
    "/admin/users": "users",
    "/admin/doctor-availability": "doctorAvailability",
    "/admin/doctor-qr": "doctorQr",
    "/ipd": "ipd",
    "/lab": "lab",
    "/imaging": "imaging",
    "/ot": "ot",
    "/admin/pharmacy": "pharmacy",
    "/pharmacy-queue": "pharmacy.queue",
    "/marketing": "marketing",
    "/admin/roles": "roles",
  };
  return map[path] || null;
}
