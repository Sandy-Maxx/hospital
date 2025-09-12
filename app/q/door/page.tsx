"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function DoorCheckInPage() {
  const search = useSearchParams();
  const doctorId = search.get("doctor") || "";
  const [tokenNumber, setTokenNumber] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenNumber || !doctorId) {
      setResult({ ok: false, message: "Missing token number or doctor code" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/queue/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenNumber, doctorId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ ok: true, message: `Checked in. Your live queue position: ${data.queuePosition}` });
      } else {
        setResult({ ok: false, message: data.error || "Failed to check in" });
      }
    } catch (e) {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md bg-white border rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold mb-1">Doctor Door Check-in</h1>
        <p className="text-sm text-gray-600 mb-4">
          Please enter your token number to register your presence at the doctor's door.
        </p>
        {!doctorId && (
          <div className="text-sm text-red-600 mb-2">
            Invalid or missing doctor code. Please scan the correct QR.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="token" className="block text-sm text-gray-700 mb-1">Token Number</label>
            <input
              id="token"
              type="text"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value.toUpperCase())}
              className="w-full border px-3 py-2 rounded"
              placeholder="e.g. MEDM023"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !doctorId}
            className="w-full py-2 rounded text-white bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Checking in..." : "Check In"}
          </button>
        </form>
        {result && (
          <div className={`mt-3 text-sm ${result.ok ? "text-green-700" : "text-red-700"}`}>
            {result.message}
          </div>
        )}
        <div className="mt-4 text-xs text-gray-500">
          Note: Your token will be prioritised by clinical triage where necessary (emergencies may be seen first).
        </div>
      </div>
    </div>
  );
}

