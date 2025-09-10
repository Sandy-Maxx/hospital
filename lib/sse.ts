type Subscriber = (message: string) => void;

const subscribers: Set<Subscriber> = new Set();

export function subscribe(sub: Subscriber): () => void {
  subscribers.add(sub);
  return () => subscribers.delete(sub);
}

export function broadcast(event: string, payload: any) {
  const message = `data: ${JSON.stringify({ event, payload, ts: Date.now() })}\n\n`;
  for (const sub of Array.from(subscribers)) {
    try {
      sub(message);
    } catch {
      // ignore
    }
  }
}

export function createSSEStream(onClose?: () => void) {
  const stream = new ReadableStream({
    start(controller) {
      // Initial hello
      controller.enqueue(`: connected\n\n`);

      // Heartbeat to keep connection alive
      const hb = setInterval(() => {
        try {
          controller.enqueue(`: ping ${Date.now()}\n\n`);
        } catch {
          // ignore
        }
      }, 15000);

      const unsub = subscribe((msg) => {
        try {
          controller.enqueue(msg);
        } catch {
          // ignore enqueue errors (connection closed)
        }
      });

      // Provide a way to close
      const close = () => {
        clearInterval(hb);
        unsub();
        try {
          controller.close();
        } catch {}
        if (onClose) onClose();
      };

      // Return cleanup when stream is canceled by client
      // Note: ReadableStream doesn't have direct cancel callback here
      // so we rely on request.signal in the route handler to invoke close().
      (controller as any).__close = close;
    },
  });

  return { stream };
}

