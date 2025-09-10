import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

export type Metric = {
  name: string;
  value: number;
  id: string;
};

function sendToAnalytics(metric: any) {
  try {
    navigator.sendBeacon(
      "/api/analytics",
      JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        label: metric.label,
        rating: metric.rating,
        navigationType: (performance as any).navigation?.type,
        timestamp: Date.now(),
      }),
    );
  } catch {
    // fallback
    fetch("/api/analytics", {
      method: "POST",
      body: JSON.stringify(metric),
      keepalive: true as any,
    });
  }
}

export function initWebVitals() {
  try {
    getCLS(sendToAnalytics);
    getFID(sendToAnalytics);
    getFCP(sendToAnalytics);
    getLCP(sendToAnalytics);
    getTTFB(sendToAnalytics);
  } catch {}
}

