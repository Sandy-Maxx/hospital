import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Re-export enhanced auth functions for gradual migration
export { withEnhancedAuth, hasPermission, usePermissions } from "./enhanced-auth";

// Keep original withAuth function unchanged for backward compatibility
export async function withAuth(
  request: NextRequest,
  requiredRoles?: string[],
): Promise<{ session: any } | NextResponse> {
  let session: any = null;
  try {
    session = await getServerSession(authOptions as any);
  } catch {
    // In non-Next test environments, gracefully treat as unauthenticated
    session = null;
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { session };
}

