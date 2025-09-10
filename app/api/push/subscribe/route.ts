import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sub = await req.json();
    // TODO: Persist subscription in database or send to push service
    console.log("Push subscription received", sub?.endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

