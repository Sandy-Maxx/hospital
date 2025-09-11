import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const departmentsPath = path.join(process.cwd(), "data", "departments.json");

// A curated, comprehensive list of common hospital departments with sensible codes.
const DEFAULT_DEPARTMENTS_SEED: { name: string; code: string }[] = [
  { name: "General Medicine", code: "GEN" },
  { name: "Cardiology", code: "CARD" },
  { name: "Neurology", code: "NEUR" },
  { name: "Orthopedics", code: "ORTH" },
  { name: "Pediatrics", code: "PED" },
  { name: "Obstetrics & Gynecology", code: "OBG" },
  { name: "Dermatology", code: "DERM" },
  { name: "ENT (Otolaryngology)", code: "ENT" },
  { name: "Ophthalmology", code: "OPH" },
  { name: "Psychiatry", code: "PSY" },
  { name: "Pulmonology", code: "PULM" },
  { name: "Gastroenterology", code: "GAST" },
  { name: "Nephrology", code: "NEPH" },
  { name: "Urology", code: "UROL" },
  { name: "Endocrinology", code: "ENDO" },
  { name: "Rheumatology", code: "RHEU" },
  { name: "Oncology", code: "ONC" },
  { name: "Hematology", code: "HEM" },
  { name: "Dental", code: "DENT" },
  { name: "Radiology", code: "RADI" },
  { name: "Anesthesiology", code: "ANES" },
  { name: "Emergency Medicine", code: "EMER" },
  { name: "Physiotherapy", code: "PHYS" },
  { name: "Rehabilitation", code: "REHAB" },
  { name: "Nutrition & Dietetics", code: "DIET" },
  { name: "Pathology", code: "PATH" },
  { name: "Microbiology", code: "MICR" },
  { name: "Immunology", code: "IMMU" },
  { name: "Infectious Diseases", code: "ID" },
  { name: "Critical Care / ICU", code: "ICU" },
  { name: "Geriatrics", code: "GERI" },
  { name: "Neonatology", code: "NEO" },
  { name: "Pain Medicine", code: "PAIN" },
  { name: "Palliative Care", code: "PALL" },
  { name: "Plastic Surgery", code: "PLAS" },
  { name: "General Surgery", code: "SURG" },
  { name: "Cardiothoracic Surgery", code: "CTS" },
  { name: "Vascular Surgery", code: "VASC" },
  { name: "Neurosurgery", code: "NSUR" },
  { name: "Pediatric Surgery", code: "PSUR" },
  { name: "Maxillofacial Surgery", code: "OMFS" },
  { name: "Occupational Therapy", code: "OT" },
  { name: "Pharmacy", code: "PHARM" },
  { name: "Laboratory Medicine", code: "LAB" },
  { name: "Nuclear Medicine", code: "NUCM" },
  { name: "Transfusion Medicine / Blood Bank", code: "BB" },
];

function generateDefaultDepartments() {
  const now = new Date().toISOString();
  return DEFAULT_DEPARTMENTS_SEED.map((d, idx) => ({
    id: crypto.randomUUID(),
    name: d.name,
    code: d.code,
    isActive: true,
    sortOrder: idx + 1,
    color: "#3B82F6",
    icon: "",
    createdAt: now,
    updatedAt: now,
  }));
}

function ensureDataFile() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(departmentsPath)) {
    const seed = generateDefaultDepartments();
    fs.writeFileSync(departmentsPath, JSON.stringify(seed, null, 2));
  }
}

function readDepartments() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(departmentsPath, "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeDepartments(list: any[]) {
  ensureDataFile();
  fs.writeFileSync(departmentsPath, JSON.stringify(list, null, 2));
}

export async function GET() {
  let items = readDepartments();
  if (!items || items.length === 0) {
    // Seed with defaults if empty
    items = generateDefaultDepartments();
    writeDepartments(items);
  } else {
    // Merge in any missing default departments by code
    const existingCodes = new Set(
      items.map((d: any) => String(d.code || '').toLowerCase())
    );
    const defaults = generateDefaultDepartments();
    const missing = defaults.filter(
      (d) => !existingCodes.has(String(d.code).toLowerCase())
    );
    if (missing.length > 0) {
      const base = items.length;
      const merged = items.concat(
        missing.map((d, idx) => ({ ...d, sortOrder: base + idx + 1 }))
      );
      writeDepartments(merged);
      items = merged;
    }
  }
  return NextResponse.json({ success: true, departments: items });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, isActive = true, sortOrder = 0, color = "#3B82F6", icon = "" } = body || {};
    if (!name || !code) {
      return NextResponse.json({ success: false, error: "Name and code are required" }, { status: 400 });
    }
    const items = readDepartments();
    if (items.some((d: any) => d.code.toLowerCase() === String(code).toLowerCase())) {
      return NextResponse.json({ success: false, error: "Code already exists" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const item = { id: crypto.randomUUID(), name, code, isActive, sortOrder, color, icon, createdAt: now, updatedAt: now };
    items.push(item);
    writeDepartments(items);
    return NextResponse.json({ success: true, department: item });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}

