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
  const fromClient = process.env.NEXT_PUBLIC_HOSPITAL_EDITION as Edition | undefined;
  const fromServer = process.env.HOSPITAL_EDITION as Edition | undefined;
  const edition = (fromClient || fromServer || "ENTERPRISE").toUpperCase() as Edition;
  if (edition === "BASIC" || edition === "ADVANCED" || edition === "ENTERPRISE") return edition;
  return "ENTERPRISE";
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
  const entitlements = getEntitlements();
  return entitlements.has(feature);
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
