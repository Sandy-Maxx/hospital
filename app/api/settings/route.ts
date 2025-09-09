import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let __settings_cache: { data: any; at: number } | null = null;
const SETTINGS_TTL_MS = 60_000;

export async function GET() {
  try {
    const now = Date.now();
    if (__settings_cache && now - __settings_cache.at < SETTINGS_TTL_MS) {
      return NextResponse.json(__settings_cache.data);
    }
    const settingsPath = path.join(
      process.cwd(),
      "data",
      "hospital-settings.json",
    );
    const settingsData = fs.readFileSync(settingsPath, "utf8");
    const json = JSON.parse(settingsData);
    __settings_cache = { data: json, at: now };
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
