"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  department?: string | null;
  specialization?: string | null;
}

export default function DoctorQrAdminPage() {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    // Load doctors and hospital branding
    (async () => {
      try {
        setLoading(true);
        const [docRes, setRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/settings/hospital"),
        ]);
        let settingsJson: any = null;
        if (setRes.ok) {
          settingsJson = await setRes.json();
          setSettings(settingsJson);
        }
        if (docRes.ok) {
          const data = await docRes.json();
          const list: Doctor[] = Array.isArray(data)
            ? data
            : (data.doctors || []);
          setDoctors(list);
          // Pre-generate QRs
          try {
            const QR = (await import("qrcode")).default;
            const base = ((settingsJson?.publicBaseUrl as string) || "").trim();
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const baseUrl = (base || origin).replace(/\/$/, "");
            const pairs = await Promise.all(
              list.map(async (d) => {
                const url = `${baseUrl}/q/door?doctorId=${encodeURIComponent(d.id)}`;
                const dataUrl = await QR.toDataURL(url, {
                  width: 300,
                  margin: 1,
                  errorCorrectionLevel: "M",
                });
                return [d.id, dataUrl] as const;
              }),
            );
            const map: Record<string, string> = {};
            for (const [id, dataUrl] of pairs) map[id] = dataUrl;
            setQrMap(map);
          } catch (e) {
            // Ignore QR failures; UI will show placeholder
            setQrMap({});
          }
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const t = filter.trim().toLowerCase();
    if (!t) return doctors;
    return doctors.filter((d) =>
      (d.name || "").toLowerCase().includes(t) ||
      (d.department || "").toLowerCase().includes(t) ||
      (d.specialization || "").toLowerCase().includes(t),
    );
  }, [filter, doctors]);

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Admin privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Door QR Codes</h1>
          <p className="text-sm text-gray-600">
            Print and place these QR codes at each doctor's door. Patients can scan to check-in at the door.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Branding Header */}
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-white print:bg-transparent">
        {settings?.logo ? (
          <img
            src={settings.logo}
            alt="logo"
            className="w-12 h-12 object-contain rounded border"
          />
        ) : (
          <div className="w-12 h-12 rounded border flex items-center justify-center bg-blue-50 text-blue-700 font-bold">
            {(settings?.name || "H").slice(0, 1)}
          </div>
        )}
        <div>
          <div className="text-lg font-semibold">{settings?.name || "Hospital"}</div>
          {settings?.tagline && (
            <div className="text-sm text-gray-600">{settings.tagline}</div>
          )}
          {(settings?.phone || settings?.email || settings?.address) && (
            <div className="text-xs text-gray-500">
              {settings?.phone}
              {settings?.phone && settings?.email ? " • " : ""}
              {settings?.email}
              {settings?.address ? ` • ${settings.address}` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center print:hidden">
        <input
          type="text"
          placeholder="Search doctor by name, department, specialization..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-96 border px-3 py-2 rounded"
        />
      </div>

      {/* Grid of QR Cards */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No doctors found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((doc) => {
            const qr = qrMap[doc.id];
            return (
              <Card key={doc.id} className="break-inside-avoid">
                <CardHeader>
                  <CardTitle className="text-gray-900">
                    Dr. {doc.name}
                    {doc.department ? (
                      <span className="block text-sm font-normal text-gray-600">{doc.department}</span>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    {qr ? (
                      <img
                        src={qr}
                        alt={`QR for ${doc.name}`}
                        className="w-56 h-56 object-contain border rounded"
                      />
                    ) : (
                      <div className="w-56 h-56 flex items-center justify-center text-gray-400 border rounded">
                        QR
                      </div>
                    )}
                    <div className="mt-3 text-center text-sm text-gray-600">
                      Scan to check-in at the doctor's door
                    </div>
                    <div className="mt-3 flex gap-2 print:hidden">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!qr) return;
                          const a = document.createElement("a");
                          a.href = qr;
                          a.download = `doctor-${doc.id}-door-qr.png`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" /> Download PNG
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Print styles to ensure nice layout on A4 */}
      {/* eslint-disable @next/next/no-css-tags */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
