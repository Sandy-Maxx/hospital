import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "marketing-campaigns.json");

type Campaign = {
  id: string;
  name: string;
  message: string;
  messageHtml?: string | null;
  channels: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    push?: boolean;
  };
  audience: any;
  scheduledAt: string | null;
  status: "SCHEDULED" | "SENT" | "CANCELLED";
  createdAt: string;
  updatedAt?: string;
  result?: { sent: number; failed: number; total: number };
};

function loadStore(): Campaign[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return [];
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStore(campaigns: Campaign[]) {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(campaigns, null, 2), "utf8");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = loadStore();
  const c = campaigns.find((c) => c.id === params.id);
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ campaign: c });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const campaigns = loadStore();
  const idx = campaigns.findIndex((c) => c.id === params.id);
  if (idx === -1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: Campaign = {
    ...campaigns[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  campaigns[idx] = updated;
  saveStore(campaigns);
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = loadStore();
  const next = campaigns.filter((c) => c.id !== params.id);
  if (next.length === campaigns.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  saveStore(next);
  return NextResponse.json({ success: true });
}
