"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Scan, Plus, AlertTriangle, Upload, FileText, IndianRupee, Settings } from "lucide-react";
import toast from "react-hot-toast";

interface ImagingService { id: string; name: string; basePrice: number; modality: string; duration?: number; contrast?: boolean; bodyPart?: string; }
interface ImagingProcedure { id: string; serviceId: string; name: string; price: number; duration?: number; code?: string; }

export default function ImagingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // Lookups
  const [services, setServices] = useState<ImagingService[]>([]);
  const [procedures, setProcedures] = useState<ImagingProcedure[]>([]);
  const loadLookups = async () => {
    try {
      const [s, p] = await Promise.all([
        fetch('/api/hospital/imaging-services?includeInactive=true'),
        fetch('/api/hospital/imaging-procedures?includeInactive=true'),
      ]);
      if (s.ok) setServices((await s.json()).services || []);
      if (p.ok) setProcedures((await p.json()).procedures || []);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadLookups();
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
  if (!['ADMIN','DOCTOR','NURSE'].includes((session.user as any).role)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3"/>
          <div className="text-xl font-semibold text-gray-900">Access restricted</div>
          <div className="text-gray-600">Imaging module is limited to Admin, Doctor, and Nurse roles.</div>
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

  // Imaging charge dialog state
  const [dlg, setDlg] = useState<{ open: boolean; adm: any | null }>({ open: false, adm: null });
  const [form, setForm] = useState({
    serviceId: "",
    procedureId: "",
    studyName: "",
    code: "",
    basePrice: 0,
    durationMins: 30,
    contrastUsed: false,
    contrastSurcharge: 0,
    portable: false,
    portableSurcharge: 0,
    urgentStat: false,
    urgentSurcharge: 0,
    radiologistFee: 0,
    filmCdCharge: 0,
    discount: 0,
    notes: "",
    reference: "",
  });

  const onSelectProcedure = (id: string) => {
    const p = procedures.find(x => x.id === id);
    if (p) {
      setForm(prev => ({
        ...prev,
        procedureId: p.id,
        serviceId: p.serviceId,
        studyName: p.name,
        basePrice: Number(p.price)||0,
        durationMins: p.duration || 30,
        code: p.code || "",
      }));
    } else {
      setForm(prev => ({ ...prev, procedureId: id }));
    }
  };

  const totalAmount = useMemo(() => {
    const sur = (form.contrastUsed ? Number(form.contrastSurcharge)||0 : 0)
      + (form.portable ? Number(form.portableSurcharge)||0 : 0)
      + (form.urgentStat ? Number(form.urgentSurcharge)||0 : 0);
    const sum = (Number(form.basePrice)||0) + (Number(form.radiologistFee)||0) + (Number(form.filmCdCharge)||0) + sur - (Number(form.discount)||0);
    return Math.max(0, sum);
  }, [form]);

  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const loadAttachments = async (admissionId: string) => {
    try {
      const r = await fetch(`/api/ipd/admissions/${admissionId}/attachments?category=imaging`);
      if (r.ok) setAttachments(((await r.json()).attachments || []).map((x: any) => ({ name: x.name, url: x.url })));
    } catch {}
  };

  const postImagingToLedger = async (adm: any) => {
    const refBase = `IMAGING:${form.code || form.studyName || 'NA'}`;
    const lines: Array<{ amount: number; description: string; ref: string }> = [];
    const add = (amt: number, desc: string, ref: string) => { const v = Number(amt)||0; if (v>0) lines.push({ amount: v, description: desc, ref }); };
    add(form.basePrice, `Imaging Base - ${form.studyName || 'Custom'}`, `${refBase}:BASE`);
    if (form.contrastUsed) add(form.contrastSurcharge, 'Contrast Surcharge', `${refBase}:CONTRAST`);
    if (form.portable) add(form.portableSurcharge, 'Portable Surcharge', `${refBase}:PORTABLE`);
    if (form.urgentStat) add(form.urgentSurcharge, 'STAT/Urgent Surcharge', `${refBase}:URGENT`);
    add(form.radiologistFee, 'Radiologist Reporting Fee', `${refBase}:RAD`);
    add(form.filmCdCharge, 'Film/CD/Media Charge', `${refBase}:MEDIA`);
    if ((Number(form.discount)||0) > 0) lines.push({ amount: -Math.abs(Number(form.discount)||0), description: 'Imaging Discount', ref: `${refBase}:DISC` });

    if (lines.length === 0) { toast.error('Nothing to post — enter amounts'); return; }
    try {
      for (const line of lines) {
        const r = await fetch('/api/ipd/ledger', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admissionId: adm.id,
            patientId: adm.patient.id,
            type: line.amount >= 0 ? 'CHARGE' : 'ADJUSTMENT',
            amount: Math.abs(line.amount),
            description: `${line.description}${form.notes ? ` — ${form.notes}` : ''}`.slice(0, 250),
            reference: line.ref,
          })
        });
        if (!r.ok) throw new Error('Failed to post ledger');
      }
      toast.success('Imaging charges posted');
      setDlg({ open: false, adm: null });
    } catch (e: any) { toast.error(e?.message || 'Failed to post charges'); }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center"><Scan className="w-7 h-7 mr-2 text-blue-600"/>Imaging</h1>
          <p className="text-gray-600">Assign studies with a detailed breakdown and upload reports</p>
        </div>
        <div>
          <Button variant="outline" onClick={loadLookups}><Settings className="w-4 h-4 mr-2"/>Refresh Lookups</Button>
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
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setDlg({ open: true, adm }); }}><Plus className="w-4 h-4 mr-1"/> Imaging Charge</Button>
                    <Button size="sm" variant="outline" onClick={() => { setUploadOpen(true); setAttachments([]); loadAttachments(adm.id); setDlg({ open: false, adm }); }}>
                      <Upload className="w-4 h-4 mr-1"/> Upload Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Imaging Charge Dialog */}
      <Dialog open={dlg.open} onOpenChange={(o) => setDlg(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Assign Imaging Study</DialogTitle>
            <DialogDescription>Breakdown includes surcharges and reporting fees</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Procedure</span>
              <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={form.procedureId} onChange={(e) => onSelectProcedure(e.target.value)}>
                <option value="">-- Select from configured list (optional) --</option>
                {procedures.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Or type custom name</span>
              <Input value={form.studyName} onChange={(e) => setForm(prev => ({ ...prev, studyName: e.target.value }))} placeholder="e.g., Chest X-Ray"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Code</span>
              <Input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Optional"/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Base Price (₹)</span>
              <Input type="number" min={0} value={form.basePrice} onChange={(e) => setForm(prev => ({ ...prev, basePrice: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Duration (mins)</span>
              <Input type="number" min={1} value={form.durationMins} onChange={(e) => setForm(prev => ({ ...prev, durationMins: Number(e.target.value || 30) }))}/>
            </div>
            <div className="hidden md:block"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="flex items-center gap-2 mb-1 text-sm">
                <input type="checkbox" checked={form.contrastUsed} onChange={(e) => setForm(prev => ({ ...prev, contrastUsed: e.target.checked }))} /> Contrast used
              </label>
              <Input type="number" min={0} value={form.contrastSurcharge} onChange={(e) => setForm(prev => ({ ...prev, contrastSurcharge: Number(e.target.value || 0) }))} placeholder="Contrast surcharge (₹)"/>
            </div>
            <div>
              <label className="flex items-center gap-2 mb-1 text-sm">
                <input type="checkbox" checked={form.portable} onChange={(e) => setForm(prev => ({ ...prev, portable: e.target.checked }))} /> Portable
              </label>
              <Input type="number" min={0} value={form.portableSurcharge} onChange={(e) => setForm(prev => ({ ...prev, portableSurcharge: Number(e.target.value || 0) }))} placeholder="Portable surcharge (₹)"/>
            </div>
            <div>
              <label className="flex items-center gap-2 mb-1 text-sm">
                <input type="checkbox" checked={form.urgentStat} onChange={(e) => setForm(prev => ({ ...prev, urgentStat: e.target.checked }))} /> STAT / Urgent
              </label>
              <Input type="number" min={0} value={form.urgentSurcharge} onChange={(e) => setForm(prev => ({ ...prev, urgentSurcharge: Number(e.target.value || 0) }))} placeholder="Urgent surcharge (₹)"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Radiologist Fee (₹)</span>
              <Input type="number" min={0} value={form.radiologistFee} onChange={(e) => setForm(prev => ({ ...prev, radiologistFee: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Film / CD Charge (₹)</span>
              <Input type="number" min={0} value={form.filmCdCharge} onChange={(e) => setForm(prev => ({ ...prev, filmCdCharge: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Discount (₹)</span>
              <Input type="number" min={0} value={form.discount} onChange={(e) => setForm(prev => ({ ...prev, discount: Number(e.target.value || 0) }))}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Notes</span>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Positioning, views, contrast agent, etc."/>
            </div>
            <div>
              <div className="p-3 bg-gray-50 rounded border h-full">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-green-700 font-semibold flex items-center"><IndianRupee className="w-4 h-4 mr-1"/>{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg({ open: false, adm: null })}>Cancel</Button>
            <Button onClick={() => { if (!dlg.adm) return; postImagingToLedger(dlg.adm); }}>Post to Ledger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report upload */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Imaging Report</DialogTitle>
            <DialogDescription>PDF or image files up to 10MB</DialogDescription>
          </DialogHeader>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget as HTMLFormElement;
            const input = formEl.querySelector("input[type='file']") as HTMLInputElement | null;
            if (!input || !input.files || input.files.length === 0) { toast.error('Choose a file'); return; }
            if (!dlg.adm) { toast.error('No admission selected'); return; }
            setUploading(true);
            try {
              const fd = new FormData();
              fd.append('file', input.files[0]);
              fd.append('category', 'imaging');
              const r = await fetch(`/api/ipd/admissions/${dlg.adm.id}/attachments`, { method: 'POST', body: fd });
              if (!r.ok) {
                const er = await r.json().catch(()=>({}));
                throw new Error(er.error || 'Upload failed');
              }
              toast.success('Uploaded');
              await loadAttachments(dlg.adm.id);
              formEl.reset();
            } catch (e: any) {
              toast.error(e?.message || 'Upload failed');
            } finally { setUploading(false); }
          }}>
            <input type="file" accept="application/pdf,image/*" />
            <div className="mt-3">
              <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
            </div>
          </form>

          <div className="border rounded mt-3">
            <div className="p-2 text-sm font-medium bg-gray-50 border-b">Attachments</div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {attachments.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No attachments yet</div>
              ) : (
                attachments.map((a, i) => (
                  <div key={i} className="p-2 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4"/> {a.name}</div>
                    <a className="text-blue-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

