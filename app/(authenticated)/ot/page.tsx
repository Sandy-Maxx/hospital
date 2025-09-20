"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, ClipboardList, Plus, AlertTriangle, Upload, Trash2, IndianRupee, Timer, FileText, X, Settings
} from "lucide-react";
import toast from "react-hot-toast";

interface OTService { id: string; name: string; basePrice: number; duration?: number; }
interface OTProcedure { id: string; serviceId: string; name: string; price: number; duration?: number; code?: string; }

export default function OTPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // OT Requests queue (PENDING/SCHEDULED)
  const [otRequests, setOtRequests] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState<'PENDING'|'SCHEDULED'>('PENDING');
  const loadOtQueue = async () => {
    try {
      const r = await fetch(`/api/ot/requests?status=${queueStatus}`);
      if (r.ok) {
        const d = await r.json();
        setOtRequests(d.requests || []);
      }
    } catch {}
  };

  // Lookups for better UX
  const [otServices, setOtServices] = useState<OTService[]>([]);
  const [otProcedures, setOtProcedures] = useState<OTProcedure[]>([]);
  const loadLookups = async () => {
    try {
      const [s, p] = await Promise.all([
        fetch('/api/hospital/ot-services?includeInactive=true'),
        fetch('/api/hospital/ot-procedures?includeInactive=true')
      ]);
      if (s.ok) {
        const d = await s.json();
        setOtServices(d.services || []);
      }
      if (p.ok) {
        const d = await p.json();
        setOtProcedures(d.procedures || []);
      }
    } catch {
      // ignore; UI will allow manual entry
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadLookups();
        await loadOtQueue();
        const res = await fetch('/api/ipd/admissions?status=ACTIVE');
        if (res.ok) {
          const d = await res.json();
          setAdmissions(d.admissions || []);
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { loadOtQueue(); }, [queueStatus]);

  if (!session?.user) return null;
  if (!['ADMIN','DOCTOR','NURSE'].includes((session.user as any).role)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3"/>
          <div className="text-xl font-semibold text-gray-900">Access restricted</div>
          <div className="text-gray-600">OT/Procedures module is limited to Admin, Doctor, and Nurse roles.</div>
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

  // Comprehensive OT charge dialog state
  const [otDialog, setOtDialog] = useState<{ open: boolean; adm: any | null }>(() => ({ open: false, adm: null }));
  const [form, setForm] = useState({
    serviceId: "",
    procedureId: "",
    procedureName: "",
    procedureCode: "",
    durationMins: 60,
    basePrice: 0,
    surgeonFee: 0,
    assistantFee: 0,
    anesthesiaFee: 0,
    otRoomRatePerHour: 0,
    otRoomHours: 1,
    consumables: [] as Array<{ name: string; amount: number }>,
    implants: [] as Array<{ name: string; amount: number }>,
    emergencySurcharge: 0, // amount
    nightSurcharge: 0, // amount
    weekendSurcharge: 0, // amount
    discount: 0,
    notes: "",
    reference: "",
  });

  const totalAmount = useMemo(() => {
    const cons = form.consumables.reduce((s, c) => s + (Number(c.amount)||0), 0);
    const imps = form.implants.reduce((s, c) => s + (Number(c.amount)||0), 0);
    const room = (Number(form.otRoomRatePerHour)||0) * (Number(form.otRoomHours)||0);
    const sum =
      (Number(form.basePrice)||0) + (Number(form.surgeonFee)||0) + (Number(form.assistantFee)||0) +
      (Number(form.anesthesiaFee)||0) + room + cons + imps +
      (Number(form.emergencySurcharge)||0) + (Number(form.nightSurcharge)||0) + (Number(form.weekendSurcharge)||0) - (Number(form.discount)||0);
    return Math.max(0, sum);
  }, [form]);

  const onSelectProcedure = (procId: string) => {
    const p = otProcedures.find(x => x.id === procId);
    if (p) {
      setForm(prev => ({
        ...prev,
        procedureId: p.id,
        serviceId: p.serviceId,
        procedureName: p.name,
        procedureCode: p.code || "",
        basePrice: Number(p.price)||0,
        durationMins: p.duration || 60,
      }));
    } else {
      setForm(prev => ({ ...prev, procedureId: procId }));
    }
  };

  // Attachments state
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const loadAttachments = async (admissionId: string) => {
    try {
      const r = await fetch(`/api/ipd/admissions/${admissionId}/attachments?category=ot`);
      if (r.ok) {
        const d = await r.json();
        setAttachments((d.attachments || []).map((a: any) => ({ name: a.name, url: a.url })));
      }
    } catch {}
  };

  const postBreakdownToLedger = async (adm: any) => {
    const refBase = `OT:${form.procedureCode || form.procedureName || 'NA'}`;
    const lines: Array<{ amount: number; description: string; reference: string }> = [];
    const pushLine = (amount: number, description: string, refSuffix: string) => {
      const amt = Number(amount)||0; if (amt <= 0) return; lines.push({ amount: amt, description, reference: `${refBase}:${refSuffix}`});
    };
    pushLine(form.basePrice, `OT Base - ${form.procedureName || 'Custom'}`, 'BASE');
    pushLine(form.surgeonFee, 'Surgeon Fee', 'SURGEON');
    pushLine(form.assistantFee, 'Assistant Surgeon Fee', 'ASSIST');
    pushLine(form.anesthesiaFee, 'Anesthetist Fee', 'ANESTH');
    pushLine((form.otRoomRatePerHour||0) * (form.otRoomHours||0), `OT Room (${form.otRoomHours}h @ ₹${form.otRoomRatePerHour}/h)`, 'OTROOM');
    form.consumables.forEach((c, i) => pushLine(c.amount, `Consumable: ${c.name}`, `CONS-${i+1}`));
    form.implants.forEach((c, i) => pushLine(c.amount, `Implant/Device: ${c.name}`, `IMPLANT-${i+1}`));
    pushLine(form.emergencySurcharge, 'Emergency Surcharge', 'EMERG');
    pushLine(form.nightSurcharge, 'Night Surcharge', 'NIGHT');
    pushLine(form.weekendSurcharge, 'Weekend/Holiday Surcharge', 'WEEKEND');

    // If discount present, add a negative adjustment
    if ((Number(form.discount)||0) > 0) {
      lines.push({ amount: -Math.abs(Number(form.discount)||0), description: 'OT Discount', reference: `${refBase}:DISC` });
    }

    if (lines.length === 0) {
      toast.error('Nothing to post — enter amounts');
      return;
    }
    try {
      for (const line of lines) {
        const r = await fetch('/api/ipd/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admissionId: adm.id,
            patientId: adm.patient.id,
            type: line.amount >= 0 ? 'CHARGE' : 'ADJUSTMENT',
            amount: Math.abs(line.amount),
            description: `${line.description}${form.notes ? ` — ${form.notes}` : ''}`.slice(0, 250),
            reference: line.reference,
          }),
        });
        if (!r.ok) throw new Error('Failed to post ledger');
      }
      toast.success('OT charges posted');
      setOtDialog({ open: false, adm: null });
    } catch (e: any) {
      toast.error(e?.message || 'Failed to post charges');
    }
  };

  const scheduleRequest = async (reqId: string, minutesFromNow = 30) => {
    try {
      const when = new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
      const r = await fetch('/api/ot/requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reqId, status: 'SCHEDULED', scheduledAt: when }) });
      if (r.ok) { toast.success('Scheduled'); await loadOtQueue(); }
      else { const e = await r.json().catch(()=>({})); toast.error(e.error || 'Failed to schedule'); }
    } catch { toast.error('Failed to schedule'); }
  };

  const unscheduleRequest = async (reqId: string) => {
    try {
      const r = await fetch('/api/ot/requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reqId, status: 'PENDING', scheduledAt: null }) });
      if (r.ok) { toast.success('Moved to Pending'); await loadOtQueue(); }
      else { const e = await r.json().catch(()=>({})); toast.error(e.error || 'Failed'); }
    } catch { toast.error('Failed'); }
  };

  const completeRequest = async (reqId: string) => {
    try {
      const r = await fetch('/api/ot/requests/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reqId, performedById: (session?.user as any)?.id || null }) });
      if (r.ok) { toast.success('OT request completed'); await loadOtQueue(); }
      else { const e = await r.json().catch(()=>({})); toast.error(e.error || 'Failed to complete request'); }
    } catch { toast.error('Failed to complete request'); }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center"><ClipboardList className="w-7 h-7 mr-2 text-purple-600"/>OT / Procedures</h1>
          <p className="text-gray-600">Post comprehensive OT/procedure charges and upload OT notes</p>
        </div>
        <div>
          <Button variant="outline" onClick={loadLookups}><Settings className="w-4 h-4 mr-2"/>Refresh Lookups</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ClipboardList className="w-5 h-5 mr-2"/>OT Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-600">View:</span>
            <select className="p-2 border rounded" value={queueStatus} onChange={(e) => setQueueStatus(e.target.value as any)}>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
          {otRequests.length === 0 ? (
            <div className="text-sm text-gray-500">No pending OT requests</div>
          ) : (
            <div className="space-y-2">
              {otRequests.map((req) => (
                <div key={req.id} className="p-3 border rounded flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{req.customName || 'Configured Procedure'}</div>
                    <div className="text-xs text-gray-600">Admission: {req.admissionId} • Priority: {req.priority || 'NORMAL'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {queueStatus === 'PENDING' ? (
                      <Button size="sm" variant="outline" onClick={() => scheduleRequest(req.id)}>Schedule (+30m)</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => unscheduleRequest(req.id)}>Move to Pending</Button>
                    )}
                    <Button size="sm" onClick={() => completeRequest(req.id)}>Mark Done (post base)</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                    <Button size="sm" onClick={() => { setOtDialog({ open: true, adm }); setForm(f => ({ ...f, reference: '' })); }}><Plus className="w-4 h-4 mr-1"/> OT Charge</Button>
                    <Button size="sm" variant="outline" onClick={() => { setUploadOpen(true); setAttachments([]); loadAttachments(adm.id); setOtDialog({ open: false, adm }); }}>
                      <Upload className="w-4 h-4 mr-1"/> Upload OT Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OT Charge Dialog */}
      <Dialog open={otDialog.open} onOpenChange={(o) => setOtDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post OT / Procedure Charge</DialogTitle>
            <DialogDescription>Comprehensive breakdown for accurate billing</DialogDescription>
          </DialogHeader>

          {/* Service/Procedure selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Procedure</span>
              <select
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
                value={form.procedureId}
                onChange={(e) => onSelectProcedure(e.target.value)}
              >
                <option value="">-- Select from configured list (optional) --</option>
                {otProcedures.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Or type custom name</span>
              <Input value={form.procedureName} onChange={(e) => setForm(prev => ({ ...prev, procedureName: e.target.value }))} placeholder="e.g., Appendectomy"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Procedure Code</span>
              <Input value={form.procedureCode} onChange={(e) => setForm(prev => ({ ...prev, procedureCode: e.target.value }))} placeholder="Optional"/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Base Price (₹)</span>
              <Input type="number" min={0} value={form.basePrice} onChange={(e) => setForm(prev => ({ ...prev, basePrice: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Duration (mins)</span>
              <Input type="number" min={1} value={form.durationMins} onChange={(e) => setForm(prev => ({ ...prev, durationMins: Number(e.target.value || 60) }))}/>
            </div>
          </div>

          {/* Fees breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Surgeon Fee (₹)</span>
              <Input type="number" min={0} value={form.surgeonFee} onChange={(e) => setForm(prev => ({ ...prev, surgeonFee: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Assistant Fee (₹)</span>
              <Input type="number" min={0} value={form.assistantFee} onChange={(e) => setForm(prev => ({ ...prev, assistantFee: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Anesthetist Fee (₹)</span>
              <Input type="number" min={0} value={form.anesthesiaFee} onChange={(e) => setForm(prev => ({ ...prev, anesthesiaFee: Number(e.target.value || 0) }))}/>
            </div>
          </div>

          {/* OT room & consumables */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">OT Room Rate (₹/hour)</span>
              <Input type="number" min={0} value={form.otRoomRatePerHour} onChange={(e) => setForm(prev => ({ ...prev, otRoomRatePerHour: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">OT Room Hours</span>
              <Input type="number" min={0} value={form.otRoomHours} onChange={(e) => setForm(prev => ({ ...prev, otRoomHours: Number(e.target.value || 0) }))}/>
            </div>
            <div className="hidden md:block"></div>
          </div>

          {/* Consumables & Implants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Consumables</div>
              {(form.consumables || []).map((c, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
                  <Input className="col-span-4" placeholder="Name" value={c.name} onChange={(e) => setForm(prev => ({ ...prev, consumables: prev.consumables.map((x,i)=> i===idx?{...x,name:e.target.value}:x) }))} />
                  <Input className="col-span-2" placeholder="Amount" type="number" min={0} value={c.amount} onChange={(e) => setForm(prev => ({ ...prev, consumables: prev.consumables.map((x,i)=> i===idx?{...x,amount:Number(e.target.value||0)}:x) }))} />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setForm(prev => ({ ...prev, consumables: [...prev.consumables, { name: '', amount: 0 }] }))}><Plus className="w-4 h-4 mr-1"/>Add</Button>
            </div>
            <div className="border rounded p-3">
              <div className="text-sm font-medium mb-2">Implants / Devices</div>
              {(form.implants || []).map((c, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2 mb-2">
                  <Input className="col-span-4" placeholder="Name" value={c.name} onChange={(e) => setForm(prev => ({ ...prev, implants: prev.implants.map((x,i)=> i===idx?{...x,name:e.target.value}:x) }))} />
                  <Input className="col-span-2" placeholder="Amount" type="number" min={0} value={c.amount} onChange={(e) => setForm(prev => ({ ...prev, implants: prev.implants.map((x,i)=> i===idx?{...x,amount:Number(e.target.value||0)}:x) }))} />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setForm(prev => ({ ...prev, implants: [...prev.implants, { name: '', amount: 0 }] }))}><Plus className="w-4 h-4 mr-1"/>Add</Button>
            </div>
          </div>

          {/* Surcharges & Discounts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Emergency Surcharge (₹)</span>
              <Input type="number" min={0} value={form.emergencySurcharge} onChange={(e) => setForm(prev => ({ ...prev, emergencySurcharge: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Night Surcharge (₹)</span>
              <Input type="number" min={0} value={form.nightSurcharge} onChange={(e) => setForm(prev => ({ ...prev, nightSurcharge: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Weekend/Holiday Surcharge (₹)</span>
              <Input type="number" min={0} value={form.weekendSurcharge} onChange={(e) => setForm(prev => ({ ...prev, weekendSurcharge: Number(e.target.value || 0) }))}/>
            </div>
            <div>
              <span className="block text-xs text-gray-600 mb-1">Discount (₹)</span>
              <Input type="number" min={0} value={form.discount} onChange={(e) => setForm(prev => ({ ...prev, discount: Number(e.target.value || 0) }))}/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <span className="block text-xs text-gray-600 mb-1">Notes</span>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Anesthesia, complications, etc."/>
            </div>
            <div>
              <div className="p-3 bg-gray-50 rounded border h-full">
                <div className="text-sm font-medium flex items-center justify-between">
                  <span>Total</span>
                  <span className="text-green-700 font-semibold flex items-center"><IndianRupee className="w-4 h-4 mr-1"/>{totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600 mt-2 flex items-center"><Timer className="w-4 h-4 mr-1"/>Duration: {form.durationMins || 60} mins</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOtDialog({ open: false, adm: null })}>Cancel</Button>
            <Button onClick={() => { if (!otDialog.adm) return; postBreakdownToLedger(otDialog.adm); }}>Post to Ledger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload OT Report */}
      <Dialog open={uploadOpen} onOpenChange={(o) => setUploadOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload OT Report / Notes</DialogTitle>
            <DialogDescription>PDF or image files up to 10MB</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget as HTMLFormElement;
              const fileInput = formEl.querySelector("input[type='file']") as HTMLInputElement | null;
              if (!fileInput || !fileInput.files || fileInput.files.length === 0) { toast.error('Choose a file'); return; }
              if (!otDialog.adm) { toast.error('No admission selected'); return; }
              setUploading(true);
              try {
                const fd = new FormData();
                fd.append('file', fileInput.files[0]);
                fd.append('category', 'ot');
                const r = await fetch(`/api/ipd/admissions/${otDialog.adm.id}/attachments`, { method: 'POST', body: fd });
                if (!r.ok) {
                  const er = await r.json().catch(()=>({}));
                  throw new Error(er.error || 'Upload failed');
                }
                toast.success('Uploaded');
                await loadAttachments(otDialog.adm.id);
                formEl.reset();
              } catch (e: any) {
                toast.error(e?.message || 'Upload failed');
              } finally {
                setUploading(false);
              }
            }}>
              <input type="file" accept="application/pdf,image/*" />
              <div className="mt-3">
                <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
              </div>
            </form>

            <div className="border rounded">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

