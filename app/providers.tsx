"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useKeyboardShortcuts } from "@/components/navigation/use-keyboard-shortcuts";
import { apiClient } from "@/lib/api-client";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && "serviceWorker" in navigator) {
      // Register service worker for PWA/offline support (prod only)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // Ignore registration failures
        });
    }

    // Initialize Web Vitals reporting in production only
    if (isProd) {
      import("@/lib/web-vitals-client").then((m) => m.initWebVitals());
    }

    // Attempt to register a Background Sync to flush pending actions (prod only)
    if (isProd && 'serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        navigator.serviceWorker.ready
          .then((reg: any) => reg.sync?.register?.('sync-pending-actions'))
          .catch(() => {});
      } catch {}
    }

    // Initialize push notifications (if public key is configured) - prod only
    if (isProd) {
      import("@/lib/notifications-client").then((m) => m.initPushNotifications());
    }
  }, []);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  // Try to sync queued offline actions when app mounts and when back online
  useEffect(() => {
    apiClient.syncQueued();
    const h = () => apiClient.syncQueued();
    window.addEventListener("online", h);

    // Listen to SW messages for background sync triggers
    const onSwMessage = (e: MessageEvent) => {
      if ((e?.data as any)?.type === 'SYNC_PENDING') {
        apiClient.syncQueued();
      }
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      window.removeEventListener("online", h);
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#22c55e",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
