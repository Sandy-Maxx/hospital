import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
    }
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error serving manifest:', error);
    return NextResponse.json({ error: 'Failed to serve manifest' }, { status: 500 });
  }
}