import { NextRequest } from "next/server";
import { createSSEStream } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  const { stream } = createSSEStream();

  // When client disconnects, abort controller if available
  const anyStream: any = stream as any;
  const controllerClose = () => {
    if (anyStream?.controller && typeof anyStream.controller.__close === "function") {
      anyStream.controller.__close();
    }
  };
  try {
    // Attempt to close on abort
    (request as any).signal?.addEventListener?.("abort", controllerClose);
  } catch {}

  return new Response(stream as any, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

