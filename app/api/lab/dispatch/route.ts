import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const statePath = path.join(process.cwd(), "data", "lab-states.json");
function ensureState() {
  const dir = path.dirname(statePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, "{}");
}
function loadStates(): Record<string, any> {
  ensureState();
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}
function saveStates(m: Record<string, any>) {
  ensureState();
  fs.writeFileSync(statePath, JSON.stringify(m, null, 2), "utf8");
}
function keyOf(prescriptionId: string, testName: string) {
  return `${prescriptionId}::${testName.toLowerCase().replace(/\s+/g, "_")}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const prescriptionId = searchParams.get("prescriptionId");
  if (!prescriptionId)
    return NextResponse.json(
      { error: "Missing prescriptionId" },
      { status: 400 },
    );
  const states = loadStates();
  const dispatchedTests: string[] = [];
  for (const k of Object.keys(states)) {
    if (k.startsWith(`${prescriptionId}::`) && states[k]?.dispatched) {
      const testName = k.split("::")[1]?.replace(/_/g, " ") || "";
      if (testName) dispatchedTests.push(testName);
    }
  }
  return NextResponse.json({
    dispatchedTests,
    allDispatched: dispatchedTests.length > 0,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { prescriptionId, tests } = body as {
    prescriptionId?: string;
    tests?: string[];
  };
  if (!prescriptionId || !Array.isArray(tests))
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const states = loadStates();
  for (const t of tests) {
    const id = keyOf(prescriptionId, t);
    states[id] = { ...(states[id] || {}), dispatched: true };
  }
  saveStates(states);
  return NextResponse.json({ success: true });
}
