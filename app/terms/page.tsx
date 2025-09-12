"use client";

import Link from "next/link";
import React, { useState } from "react";
import TermsContent from "@/components/legal/terms-content";

export default function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <div className="border-b bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-gray-800">Terms & Conditions</div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            <Link href="/book-appointment" className="text-blue-600 hover:underline">Book Appointment</Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <TermsContent />

        {/* Accept footer */}
        <div className="mt-10 border-t pt-4">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>I have read and accept these Terms & Conditions.</span>
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button
              className={`px-4 py-2 rounded border ${accepted ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 text-gray-500 border-gray-200"}`}
              disabled={!accepted}
              onClick={() => {
                try { localStorage.setItem("termsAccepted", "true"); } catch {}
              }}
            >
              Accept
            </button>
            <Link href="/book-appointment" className="text-blue-600 hover:underline text-sm">
              Continue to Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
