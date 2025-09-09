"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  open: boolean;
  onClose: () => void;
}

export default function PrescriptionViewModal({ id, open, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/prescriptions/${id}`)
      .then(async (res) => {
        if (res.ok) setData((await res.json()).prescription);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, open]);

  if (!open) return null;

  const parseMedicines = (json: string) => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  const meds = data ? parseMedicines(data.medicines) : {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Prescription Details</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !data ? (
          <div className="text-center py-8">Not found</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <strong>Patient:</strong> {data.patient.firstName}{" "}
              {data.patient.lastName}
            </div>
            <div>
              <strong>Doctor:</strong> {data.doctor.name}
            </div>
            <div>
              <strong>Date:</strong> {new Date(data.createdAt).toLocaleString()}
            </div>
            {data.consultation && (
              <div className="mt-2 p-3 bg-gray-50 rounded">
                <div>
                  <strong>Symptoms:</strong> {data.consultation.symptoms || "-"}
                </div>
                <div>
                  <strong>Diagnosis:</strong>{" "}
                  {data.consultation.diagnosis || "-"}
                </div>
                <div>
                  <strong>Notes:</strong> {data.consultation.notes || "-"}
                </div>
              </div>
            )}
            <div className="mt-2">
              <strong>Medicines:</strong>
              <div className="mt-1 space-y-1">
                {(meds.medicines || []).map((m: any, i: number) => (
                  <div key={i} className="p-2 bg-blue-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{m.name}</span>
                      <span>{m.dosage}</span>
                    </div>
                    <div className="text-xs">
                      {m.frequency} • {m.duration}
                    </div>
                    {m.instructions && (
                      <div className="text-xs text-gray-600">
                        {m.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
