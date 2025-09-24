"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LabReportsUpload from "@/components/prescriptions/lab-reports-upload";
import { formatPrescriptionNumber } from "@/lib/identifiers";
import Breadcrumb from "@/components/navigation/breadcrumb";
import { hasFeature } from "@/lib/edition";

interface LabJob {
  id: string;
  billId: string;
  prescriptionId: string;
  prescriptionCreatedAt?: string;
  patient: any;
  doctor: any;
  test: { name: string; instructions?: string };
  sampleNeeded: boolean;
  sampleTaken: boolean;
  resultUploaded: boolean;
  sampleType?: string;
  notes?: string;
}

export default function LabPage() {
  const { data: session } = useSession();
  
  // Check if user has access to Lab feature
  if (!hasFeature("lab")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Lab Management is not available in your current edition.
          </p>
          <p className="text-center text-gray-500 mt-2">
            Please upgrade to ADVANCED or ENTERPRISE edition to access Lab features.
          </p>
        </CardContent>
      </Card>
    );
  }
  const [jobs, setJobs] = useState<LabJob[]>([]);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "SAMPLED" | "UPLOADED"
  >("ALL");
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    prescriptionId: string;
    testNames: string[];
  } | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await fetch("/api/lab/jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs || []);
    }
  };

  const setState = async (id: string, patch: Partial<LabJob>) => {
    await fetch("/api/lab/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    fetchJobs();
  };

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { prescriptionId: string; patient: any; doctor: any; tests: LabJob[] }
    >();
    for (const j of jobs) {
      const g = map.get(j.prescriptionId) || {
        prescriptionId: j.prescriptionId,
        patient: j.patient,
        doctor: j.doctor,
        tests: [],
      };
      g.tests.push(j);
      map.set(j.prescriptionId, g);
    }
    return Array.from(map.values());
  }, [jobs]);

  const filtered = useMemo(() => {
    const byStatus = (g: { tests: LabJob[] }) => {
      const allUploaded = g.tests.every((t) => t.resultUploaded);
      const anySampled = g.tests.some((t) => t.sampleTaken);
      const allSampled = g.tests.every((t) => !t.sampleNeeded || t.sampleTaken);
      if (allUploaded) return "UPLOADED";
      if (allSampled && !allUploaded) return "SAMPLED";
      return "PENDING";
    };
    if (filter === "ALL") return groups;
    return groups.filter((g) => byStatus(g) === filter);
  }, [groups, filter]);

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <Card className="m-6">
        <CardContent className="pt-6">Access denied. Admin only.</CardContent>
      </Card>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: "Path Lab", href: "/lab" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Path Lab</h1>
          <p className="text-gray-600">Manage samples and lab reports</p>
        </div>
        <div className="flex items-center gap-2">
          <a className="p-2 border rounded text-sm" href="/pharmacy-queue" title="Go to Pharmacy Queue">Pharmacy Queue</a>
          <select
            className="p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending Sample</option>
            <option value="SAMPLED">Sample Taken</option>
            <option value="UPLOADED">Result Uploaded</option>
          </select>
          <Button variant="outline" onClick={fetchJobs}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lab Queue</CardTitle>
          <CardDescription>
            Tests derived from paid bills and prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-500">No lab jobs.</div>
          ) : !jobs.length ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-64" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((g) => {
                const allUploaded = g.tests.every((t) => t.resultUploaded);
                const allSampled = g.tests.every(
                  (t) => !t.sampleNeeded || t.sampleTaken,
                );
                const pendingCount = g.tests.filter(
                  (t) => !t.sampleTaken && !t.resultUploaded,
                ).length;
                return (
                  <div key={g.prescriptionId} className="p-4 border rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          Prescription:{" "}
                          {(() => {
                            const createdAt =
                              g.tests?.[0]?.prescriptionCreatedAt || undefined;
                            const id = g.prescriptionId;
                            return formatPrescriptionNumber({ id, createdAt });
                          })()}
                        </div>
                        <div className="text-sm text-gray-700">
                          Patient: {g.patient?.firstName} {g.patient?.lastName}{" "}
                          • Doctor: {g.doctor?.name}
                        </div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-800">
                            Tests ({g.tests.length}):
                          </div>
                          <ul className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {g.tests.map((t, idx) => (
                              <li
                                key={`${t.id}-${idx}`}
                                className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded"
                              >
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {t.test.name}
                                  </div>
                                  {t.test.instructions && (
                                    <div className="text-xs text-gray-500">
                                      Instructions: {t.test.instructions}
                                    </div>
                                  )}
                                  <div className="mt-0.5 text-xs text-gray-600">
                                    Sample needed:{" "}
                                    {t.sampleNeeded ? "Yes" : "No"} • Sample
                                    taken: {t.sampleTaken ? "Yes" : "No"} •
                                    Result uploaded:{" "}
                                    {t.resultUploaded ? "Yes" : "No"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t.sampleNeeded && !t.sampleTaken && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        setState(t.id, { sampleTaken: true })
                                      }
                                    >
                                      Mark Sample Taken
                                    </Button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          {!allSampled && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  // mark sample taken for all needing samples in batch then refresh once
                                  const needing = g.tests.filter(
                                    (x) => x.sampleNeeded && !x.sampleTaken,
                                  );
                                  await Promise.all(
                                    needing.map((x) =>
                                      fetch("/api/lab/jobs", {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          id: x.id,
                                          sampleTaken: true,
                                        }),
                                      }),
                                    ),
                                  );
                                  fetchJobs();
                                }}
                              >
                                Mark All Samples Taken
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${allUploaded ? "bg-green-100 text-green-700" : allSampled ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {allUploaded
                            ? "All Uploaded"
                            : allSampled
                              ? "Sampled"
                              : `Pending (${pendingCount})`}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setUploadModal({
                              open: true,
                              prescriptionId: g.prescriptionId,
                              testNames: g.tests.map((t) => t.test.name),
                            })
                          }
                        >
                          Upload Reports (Bundle)
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {uploadModal && (
        <LabReportsUpload
          open={uploadModal.open}
          onClose={() => {
            setUploadModal(null);
            fetchJobs();
          }}
          prescriptionId={uploadModal.prescriptionId}
          labTests={uploadModal.testNames.map((n) => ({ name: n }))}
        />
      )}
    </div>
  );
}
