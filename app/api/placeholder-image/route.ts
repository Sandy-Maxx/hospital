import { NextRequest, NextResponse } from 'next/server';

// Force dynamic behavior for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logo';
    const width = parseInt(searchParams.get('width') || '200');
    const height = parseInt(searchParams.get('height') || '80');
    
    // Create a simple SVG placeholder
    let backgroundColor = '#3b82f6';
    let text = 'LOGO';
    let fontSize = Math.min(width, height) / 4;
    
    switch (type) {
      case 'logo':
        backgroundColor = '#3b82f6';
        text = 'MediCare';
        break;
      case 'favicon':
        backgroundColor = '#2563eb';
        text = 'M';
        fontSize = Math.min(width, height) * 0.7;
        break;
      case 'icon':
        backgroundColor = '#1d4ed8';
        text = 'MC';
        fontSize = Math.min(width, height) / 3;
        break;
    }
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${backgroundColor}" rx="4"/>
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          fill="white" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}px" 
          font-weight="bold"
        >
          ${text}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    
    // Return a minimal fallback SVG
    const fallbackSvg = `
      <svg width="100" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="40" fill="#6b7280"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="Arial" font-size="12px">IMG</text>
      </svg>
    `;
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
}