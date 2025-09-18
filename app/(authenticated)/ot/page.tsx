"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, ClipboardList, Plus, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function OTPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [postDialog, setPostDialog] = useState<{ open: boolean; adm: any | null; name: string; amount: number; reference: string }>({ open: false, adm: null, name: "", amount: 0, reference: "" });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ipd/admissions?status=ACTIVE');
        if (res.ok) {
          const d = await res.json();
          setAdmissions(d.admissions || []);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  if (!session?.user) return null;
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3"/>
          <div className="text-xl font-semibold text-gray-900">Access restricted</div>
          <div className="text-gray-600">OT/Procedures module is currently limited to Admin.</div>
        </div>
      </div>
    );
  }

  const filtered = admissions.filter((a) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const patient = `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase();
    const phone = (a.patient.phone || '').toLowerCase();
    const bed = `${a.bed?.ward?.name || ''} ${a.bed?.bedNumber || ''}`.toLowerCase();
    return patient.includes(term) || phone.includes(term) || bed.includes(term) || a.id.toLowerCase().includes(term);
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
<h1 className="text-3xl font-bold text-gray-900 flex items-center"><ClipboardList className="w-7 h-7 mr-2 text-purple-600"/>OT / Procedures</h1>
          <p className="text-gray-600">Post procedures/OT charges into the IPD ledger</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-4 h-4 text-gray-500"/>
            <Input placeholder="Search active admissions by patient, phone, bed or admission ID" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xl"/>
          </div>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No active admissions found</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((adm) => (
                <div key={adm.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{adm.patient.firstName} {adm.patient.lastName} <span className="text-xs text-gray-500">({adm.patient.phone})</span></div>
                    <div className="text-xs text-gray-600">Admission: {adm.id} • Ward: {adm.bed?.ward?.name || '-'} • Bed: {adm.bed?.bedNumber || '-'}</div>
                  </div>
                  <div>
                    <Button size="sm" onClick={() => setPostDialog({ open: true, adm, name: "", amount: 0, reference: "" })}><Plus className="w-4 h-4 mr-1"/> Add Procedure Charge</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={postDialog.open} onOpenChange={(o) => setPostDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post Procedure/OT Charge</DialogTitle>
            <DialogDescription>Record a procedure performed for this admission</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="block text-sm text-gray-700 mb-1">Procedure Name</span>
              <Input value={postDialog.name} onChange={(e) => setPostDialog(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Appendectomy, Central line insertion"/>
            </div>
            <div>
              <span className="block text-sm text-gray-700 mb-1">Amount (₹)</span>
              <Input type="number" min={0} value={postDialog.amount} onChange={(e) => setPostDialog(prev => ({ ...prev, amount: parseFloat(e.target.value || '0') }))}/>
            </div>
            <div>
              <span className="block text-sm text-gray-700 mb-1">Reference</span>
              <Input value={postDialog.reference} onChange={(e) => setPostDialog(prev => ({ ...prev, reference: e.target.value }))} placeholder="Procedure ID or reference"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={async () => {
              const adm = postDialog.adm; if (!adm) return;
              if (!postDialog.name || postDialog.amount <= 0) { toast.error('Enter valid name and amount'); return; }
              try {
                const res = await fetch('/api/ipd/ledger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: adm.id, patientId: adm.patient.id, type: 'CHARGE', amount: postDialog.amount, description: `PROCEDURE: ${postDialog.name}`, reference: `OT:${postDialog.reference || 'N/A'}` }) });
                if (res.ok) { toast.success('Procedure charge added'); setPostDialog(prev => ({ ...prev, open: false })); }
                else { const er = await res.json().catch(()=>({})); toast.error(er.error || 'Failed'); }
              } catch { toast.error('Failed'); }
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

