"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { hasFeature } from "@/lib/edition";
import { Button } from "@/components/ui/button";

export default function PharmacyQueuePage() {
  const { data: session } = useSession();
  
  // Check if user has access to Pharmacy feature
  if (!hasFeature("pharmacy")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Pharmacy Queue is not available in your current edition.
          </p>
          <p className="text-center text-gray-500 mt-2">
            Please upgrade to ADVANCED or ENTERPRISE edition to access Pharmacy features.
          </p>
        </CardContent>
      </Card>
    );
  }
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL"|"PENDING"|"DISPATCHED"|"DISPENSED">("ALL");

  const fetchJobs = async () => {
    const r = await fetch('/api/pharmacy/jobs');
    if (r.ok) {
      const d = await r.json();
      setJobs(d.jobs || []);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const groups = useMemo(() => {
    const map = new Map<string, { prescriptionId: string; patient: any; doctor: any; items: any[] }>();
    for (const j of jobs) {
      const g = map.get(j.prescriptionId) || { prescriptionId: j.prescriptionId, patient: j.patient, doctor: j.doctor, items: [] as any[] };
      g.items.push(j);
      map.set(j.prescriptionId, g);
    }
    let arr = Array.from(map.values());
    if (filter !== 'ALL') {
      arr = arr.filter(g => {
        const dispensedAll = g.items.every(i => i.dispensed);
        const anyDispatched = g.items.some(i => i.dispatched);
        if (filter === 'DISPENSED') return dispensedAll;
        if (filter === 'DISPATCHED') return anyDispatched && !dispensedAll;
        if (filter === 'PENDING') return !anyDispatched;
        return true;
      });
    }
    return arr;
  }, [jobs, filter]);

  const setState = async (id: string, patch: any) => {
    await fetch('/api/pharmacy/jobs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
    fetchJobs();
  };

  if (!session?.user || session.user.role !== 'ADMIN') {
    return <Card className="m-6"><CardContent className="pt-6">Access denied. Admin only.</CardContent></Card>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Queue</h1>
          <p className="text-gray-600">IPD/OPD medication fulfillment</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="p-2 border rounded" value={filter} onChange={(e)=>setFilter(e.target.value as any)}>
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DISPENSED">Dispensed</option>
          </select>
          <Button variant="outline" onClick={fetchJobs}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Worklist</CardTitle>
          <CardDescription>Grouped by prescription</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-sm text-gray-500">No pharmacy jobs</div>
          ) : (
            <div className="space-y-4">
              {groups.map(g => {
                const allDispensed = g.items.every(i => i.dispensed);
                const anyDispatched = g.items.some(i => i.dispatched);
                const pending = g.items.filter(i => !i.dispensed);
                return (
                  <div key={g.prescriptionId} className="p-4 border rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">Prescription: {g.prescriptionId.slice(0,8)}...</div>
                        <div className="text-sm text-gray-700">Patient: {g.patient?.firstName} {g.patient?.lastName} • Doctor: {g.doctor?.name}</div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-800">Items ({g.items.length}):</div>
                          <ul className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {g.items.map((it) => (
                              <li key={it.id} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium text-gray-900">{it.medicine.name}</div>
                                  <div className="text-xs text-gray-600">Qty: {it.medicine.quantity} • Dispatched: {it.dispatched ? 'Yes' : 'No'} • Dispensed: {it.dispensed ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!it.dispensed && (
                                    <Button size="sm" onClick={() => setState(it.id, { dispensed: true })}>Mark Dispensed</Button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          {!allDispensed && anyDispatched && (
                            <div className="mt-2">
                              <Button size="sm" variant="outline" onClick={async () => {
                                await Promise.all(pending.map((x:any) => fetch('/api/pharmacy/jobs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: x.id, dispensed: true }) })));
                                fetchJobs();
                              }}>Mark All Dispensed</Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-xs px-2 py-1 rounded-full ${allDispensed ? 'bg-green-100 text-green-700' : anyDispatched ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                          {allDispensed ? 'Dispensed' : anyDispatched ? 'Dispatched' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
