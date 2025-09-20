import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    // Basic CSP; expand as needed. Avoid blocking Next internals.
    res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "img-src 'self' data: blob: https://*",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "connect-src 'self' https://* ws: wss:",
        "frame-ancestors 'self'"
      ].join("; ")
    );
  }
  return res;
}

export const config = {
  // Exclude Next internals and static assets from middleware to avoid affecting public files
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|uploads/|icons?/).*)",
  ],
};

