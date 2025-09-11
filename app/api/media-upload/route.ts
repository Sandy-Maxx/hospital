import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function saveFileFromFormData(file: File, destPath: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, buffer);
}

function loadSettings() {
  const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    }
  } catch {}
  return {} as any;
}

function saveSettings(settings: any) {
  const settingsPath = path.join(process.cwd(), "data", "hospital-settings.json");
  ensureDir(path.dirname(settingsPath));
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "logo"); // logo | favicon | pwaIcon

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    ensureDir(uploadsDir);
    const stamp = Date.now();
    const baseName = `${kind}-${stamp}.${ext}`;
    const dest = path.join(uploadsDir, baseName);
    await saveFileFromFormData(file, dest);

    const publicPath = `/uploads/${baseName}`;

    // Update settings
    const settings = loadSettings();
    if (kind === 'logo') settings.logo = publicPath;
    if (kind === 'favicon') settings.favicon = publicPath;
    if (kind === 'pwaIcon') settings.pwaIcon = publicPath;
    saveSettings(settings);

    // Apply to app-level assets when needed
    if (kind === 'favicon') {
      const favDest = path.join(process.cwd(), 'public', 'favicon.ico');
      fs.copyFileSync(dest, favDest);
      settings.faviconVersion = Date.now();
    }

    if (kind === 'pwaIcon') {
      const iconPng = path.join(process.cwd(), 'public', 'icon.png');
      const icon192 = path.join(process.cwd(), 'public', 'icon-192.png');
      const icon512 = path.join(process.cwd(), 'public', 'icon-512.png');
      fs.copyFileSync(dest, iconPng);
      fs.copyFileSync(dest, icon192);
      fs.copyFileSync(dest, icon512);
      const manifest = {
        name: settings.name || 'Hospital',
        short_name: (settings.name || 'Hospital').slice(0, 12),
        start_url: '/',
        display: 'standalone',
        background_color: settings.primaryColor || '#ffffff',
        theme_color: settings.primaryColor || '#2563eb',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      };
      settings.pwaVersion = Date.now();
      fs.writeFileSync(path.join(process.cwd(), 'public', 'manifest.json'), JSON.stringify(manifest, null, 2));
    }

    return NextResponse.json({ success: true, path: publicPath, kind });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

