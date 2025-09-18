"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Bed, Users, Activity, AlertCircle, CheckCircle,
  Settings, Plus, Search, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import LedgerDialog from "@/components/ipd/ledger-dialog";

interface BedType {
  id: string;
  name: string;
  description: string;
  dailyRate: number;
  amenities: string[];
  maxOccupancy: number;
}

interface Ward {
  id: string;
  name: string;
  description: string;
  floor: string;
  department: string;
  capacity: number;
  bedTypes: BedType[];
  statistics: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    blockedBeds: number;
    occupancyRate: number;
  };
}

interface BedInfo {
  id: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";
  notes: string | null;
  ward: {
    id: string;
    name: string;
    floor: string;
    department: string;
  };
  bedType: BedType;
  currentAdmission: {
    id: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      gender: string;
    };
    admittedByUser: {
      id: string;
      name: string;
      role: string;
    };
  } | null;
  isOccupied: boolean;
}

function AdmissionRequestsPanel() {
  const [alloc, setAlloc] = useState<{ open: boolean; req: any | null; wardId: string; bedId: string }>({ open: false, req: null, wardId: '', bedId: '' });
  const [wardsList, setWardsList] = useState<any[]>([]);
  const [bedsList, setBedsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("PENDING");

  const loadMeta = useCallback(async () => {
    try {
      const [wRes, bRes] = await Promise.all([
        fetch('/api/ipd/wards'),
        fetch('/api/ipd/beds?status=AVAILABLE'),
      ]);
      const w = await wRes.json().catch(()=>({ wards: [] }));
      const b = await bRes.json().catch(()=>({ beds: [] }));
      if (wRes.ok) setWardsList(w.wards || []);
      if (bRes.ok) setBedsList(b.beds || []);
    } catch {}
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ipd/admission-requests?status=${encodeURIComponent(filter)}`);
      const data = await res.json();
      if (res.ok) setRequests(data.admissionRequests || []);
    } catch (e) {
      console.error('Failed to fetch admission requests', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Load metadata once on mount
  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Fetch requests when filter changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="AWAITING_DEPOSIT">Awaiting Deposit</SelectItem>
              <SelectItem value="DEPOSIT_PAID">Deposit Paid</SelectItem>
              <SelectItem value="CONVERTED">Converted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}><RefreshCw className="h-4 w-4 mr-2"/>Refresh</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No requests</div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{r.patient.firstName} {r.patient.lastName} <span className="text-xs text-gray-500">({r.patient.phone})</span></div>
                  <div className="text-xs text-gray-600">Requested: {new Date(r.requestedAt).toLocaleString()} • Doctor: Dr. {r.doctor.name}</div>
                  <div className="text-xs text-gray-600">Ward: {r.wardType || '-'} • Bed: {r.bedType || '-'} • Urgency: {r.urgency}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'PENDING' && (
                    <>
                      <Button size="sm" onClick={async () => {
                        try {
                          const res = await fetch('/api/ipd/admission-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: r.prescriptionId, status: 'AWAITING_DEPOSIT' }) });
                          if (res.ok) { 
                            toast.success('Admission request approved');
                            fetchRequests(); 
                          } else {
                            toast.error('Failed to approve request');
                          }
                        } catch {
                          toast.error('Failed to approve request');
                        }
                      }}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        try {
                          const res = await fetch('/api/ipd/admission-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: r.prescriptionId, status: 'REJECTED' }) });
                          if (res.ok) {
                            toast.success('Admission request rejected');
                            fetchRequests();
                          } else {
                            toast.error('Failed to reject request');
                          }
                        } catch {
                          toast.error('Failed to reject request');
                        }
                      }}>Reject</Button>
                    </>
                  )}
                  {r.status === 'AWAITING_DEPOSIT' && (
                    <Badge>Awaiting Deposit</Badge>
                  )}
                  {r.status === 'DEPOSIT_PAID' && (
                    <>
                      <Badge variant="secondary">Deposit Paid</Badge>
                      <Button size="sm" onClick={() => setAlloc({ open: true, req: r, wardId: '', bedId: '' })}>Allocate Bed</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Allocate Bed Dialog */}
      <Dialog open={alloc.open} onOpenChange={(o) => setAlloc(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Bed</DialogTitle>
            <DialogDescription>Select ward and available bed for this admission</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className="block text-sm text-gray-700 mb-1">Ward</span>
              <Select value={alloc.wardId} onValueChange={(v) => setAlloc(prev => ({ ...prev, wardId: v }))}>
                <SelectTrigger className="w-full bg-white border border-gray-200"><SelectValue placeholder="Select ward"/></SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {wardsList.map((w: any) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="block text-sm text-gray-700 mb-1">Bed</span>
              <Select value={alloc.bedId} onValueChange={(v) => setAlloc(prev => ({ ...prev, bedId: v }))}>
                <SelectTrigger className="w-full bg-white border border-gray-200"><SelectValue placeholder="Select available bed"/></SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {bedsList.filter((b:any) => !alloc.wardId || b.ward.id === alloc.wardId).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.ward.name} - {b.bedNumber} ({b.bedType.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlloc(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={async () => {
              if (!alloc.req || !alloc.bedId) { 
                toast.error('Please select a ward and bed'); 
                return; 
              }
              try {
                // 1) Create admission (also sets bed to OCCUPIED in API)
                const admRes = await fetch('/api/ipd/admissions', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ 
                    patientId: alloc.req.patientId, 
                    bedId: alloc.bedId, 
                    doctorId: alloc.req.doctorId,
                    diagnosis: alloc.req.diagnosis,
                    chiefComplaint: alloc.req.chiefComplaint,
                    estimatedStay: alloc.req.estimatedStay
                  }) 
                });
                if (!admRes.ok) { throw new Error('Failed to create admission'); }
                // 2) Mark admission request converted
                const reqRes = await fetch('/api/ipd/admission-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: alloc.req.prescriptionId, status: 'CONVERTED' }) });
                if (!reqRes.ok) { throw new Error('Failed to update admission request'); }
                toast.success('Bed allocated and admission created');
                setAlloc(prev => ({ ...prev, open: false }));
                fetchRequests();
              } catch (e: any) {
                toast.error(e?.message || 'Failed to allocate bed');
              }
            }}>Allocate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function IPDPage() {
  const { data: session } = useSession();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
    blockedBeds: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [bedDialog, setBedDialog] = useState<{ open: boolean; bed: BedInfo | null }>({ open: false, bed: null });
  const [admissionStats, setAdmissionStats] = useState<{ admissionDate: string; days: number; bedCharges: number; deposits: number; totalPaid: number; otherCharges: number } | null>(null);
  const [addCharge, setAddCharge] = useState<{ open: boolean; itemType: 'MEDICINE' | 'PROCEDURE' | 'OTHER'; itemName: string; quantity: number; unitPrice: number; gstRate: number }>({ open: false, itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: 0, gstRate: 0 });
  const [ledgerDialog, setLedgerDialog] = useState<{ open: boolean; admissionId: string | null; loading: boolean; transactions: any[]; summary: any }>({ open: false, admissionId: null, loading: false, transactions: [], summary: null });
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIPDData = async () => {
    setLoading(true);
    try {
      // Fetch wards
      const wardsResponse = await fetch("/api/ipd/wards");
      const wardsData = await wardsResponse.json();
      
      if (wardsResponse.ok) {
        setWards(wardsData.wards);
        setOverallStats(wardsData.overallStats);
      }

      // Fetch beds
      const bedsResponse = await fetch("/api/ipd/beds");
      const bedsData = await bedsResponse.json();
      
      if (bedsResponse.ok) {
        setBeds(bedsData.beds);
      }
    } catch (error) {
      console.error("Error fetching IPD data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPDData();
  }, []);

  // When bed dialog opens, compute running stats
  const recalcAdmissionStats = async () => {
    const bed = bedDialog.bed;
    if (!bed || !bed.currentAdmission) { setAdmissionStats(null); return; }
    try {
      const admRes = await fetch(`/api/ipd/admissions?id=${bed.currentAdmission.id}`);
      if (!admRes.ok) { setAdmissionStats(null); return; }
      const admData = await admRes.json();
      const adm = admData.admission;
      const admissionDate = adm?.admissionDate || adm?.createdAt || new Date().toISOString();
      const since = new Date(admissionDate);
      const now = new Date();
      const days = Math.max(1, Math.ceil((now.getTime() - since.getTime()) / (24*60*60*1000)));
      const rate = Number(bed.bedType.dailyRate || 0);
      const bedCharges = rate * days;
      const billsRes = await fetch(`/api/bills?patientId=${bed.currentAdmission.patient.id}`);
      let deposits = 0;
      let totalPaid = 0;
      let otherCharges = 0;
      if (billsRes.ok) {
        const billsData = await billsRes.json();
        const bills = billsData.bills || [];
        bills.forEach((b: any) => {
          const created = new Date(b.createdAt);
          if (created >= since) {
            const lineTotal = (b.finalAmount ?? b.totalAmount ?? 0);
            otherCharges += lineTotal;
            const paid = b.paymentStatus === 'PAID' ? lineTotal : 0;
            totalPaid += paid;
            const isDeposit = (b.billItems || []).some((it: any) => String(it.itemName || '').toLowerCase().includes('deposit')) || String(b.notes||'').toLowerCase().includes('deposit');
            if (isDeposit) deposits += paid;
          }
        });
      }
      setAdmissionStats({ admissionDate: since.toISOString(), days, bedCharges, deposits, totalPaid, otherCharges });
    } catch { setAdmissionStats(null); }
  };

  useEffect(() => { recalcAdmissionStats(); }, [bedDialog.open]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200";
      case "OCCUPIED":
        return "bg-red-100 text-red-800 border-red-200";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "BLOCKED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4" />;
      case "OCCUPIED":
        return <Users className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4" />;
      case "BLOCKED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bed className="h-4 w-4" />;
    }
  };

  const toggleMaintenance = async (next: 'MAINTENANCE' | 'AVAILABLE') => {
    if (!bedDialog.bed) return;
    try {
      const res = await fetch('/api/ipd/beds', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bedId: bedDialog.bed.id, status: next }) });
      if (!res.ok) { toast.error('Failed to update bed'); return; }
      toast.success(next === 'MAINTENANCE' ? 'Bed put into maintenance' : 'Bed marked available');
      await fetchIPDData();
      setBedDialog(prev => ({ ...prev, open: true, bed: beds.find(b => b.id === bedDialog.bed!.id) || prev.bed }));
    } catch {
      toast.error('Failed to update bed');
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesWard = selectedWard === "all" || bed.ward.id === selectedWard;
    const matchesStatus = selectedStatus === "all" || bed.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.ward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bed.currentAdmission && 
        `${bed.currentAdmission.patient.firstName} ${bed.currentAdmission.patient.lastName}`
          .toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesWard && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IPD Management</h1>
          <p className="text-gray-600 mt-1">In-Patient Department - Bed & Ward Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchIPDData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beds</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalBeds}</p>
              </div>
              <Bed className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-red-600">{overallStats.occupiedBeds}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.availableBeds}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{overallStats.maintenanceBeds}</p>
              </div>
              <Settings className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy</p>
                <p className="text-2xl font-bold text-purple-600">{overallStats.occupancyRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wards" className="w-full">
        {/* Bed Details Dialog */}
        <Dialog open={bedDialog.open} onOpenChange={(o) => setBedDialog(prev => ({ ...prev, open: o }))}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bed Details - {bedDialog.bed?.bedNumber}</DialogTitle>
              <DialogDescription>Ward: {bedDialog.bed?.ward.name} • Type: {bedDialog.bed?.bedType.name}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Status</div>
                <Badge className={getStatusColor(bedDialog.bed?.status || 'AVAILABLE')}>
                  {getStatusIcon(bedDialog.bed?.status || 'AVAILABLE')}
                  <span className="ml-1">{bedDialog.bed?.status}</span>
                </Badge>
                <div className="text-sm text-gray-600">Rate</div>
                <div className="font-semibold">₹{bedDialog.bed?.bedType.dailyRate}/day</div>
                {bedDialog.bed?.notes && (
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs text-yellow-800">
                    {bedDialog.bed?.notes}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {bedDialog.bed?.currentAdmission ? (
                  <div className="space-y-1">
                    <div className="font-semibold">Current Patient</div>
                    <div className="text-sm">{bedDialog.bed.currentAdmission.patient.firstName} {bedDialog.bed.currentAdmission.patient.lastName} ({bedDialog.bed.currentAdmission.patient.phone})</div>
                    <div className="text-xs text-gray-600">Admitted by: {bedDialog.bed.currentAdmission.admittedByUser.name}</div>
                    {admissionStats && (
                      <div className="mt-2 space-y-1 text-sm">
                        <div>Admitted: {new Date(admissionStats.admissionDate).toLocaleString()}</div>
                        <div>Days: {admissionStats.days}</div>
                        <div>Bed Charges: ₹{admissionStats.bedCharges.toLocaleString()}</div>
                        <div>Deposits Paid: ₹{admissionStats.deposits.toLocaleString()}</div>
                        <div>Total Paid: ₹{admissionStats.totalPaid.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No active admission</div>
                )}
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {bedDialog.bed?.status !== 'OCCUPIED' && (
                  <>
                    {bedDialog.bed?.status !== 'MAINTENANCE' ? (
                      <Button variant="outline" onClick={() => toggleMaintenance('MAINTENANCE')}>Put into Maintenance</Button>
                    ) : (
                      <Button variant="outline" onClick={() => toggleMaintenance('AVAILABLE')}>Mark Available</Button>
                    )}
                  </>
                )}
                {bedDialog.bed?.currentAdmission && (
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setAddCharge({ open: true, itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: 0, gstRate: 0 })}>Add Charge / Service / Medicine</Button>
                    <Button variant="outline" onClick={async () => { try { const res = await fetch('/api/ipd/ledger/bed-charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: bedDialog.bed?.currentAdmission?.id }) }); if (res.ok) { toast.success('Posted today\'s bed charge'); await recalcAdmissionStats(); } else { toast.error('Failed to post bed charge'); } } catch { toast.error('Failed to post bed charge'); } }}>Post Today&apos;s Bed Charge</Button>
                    <Button variant="outline" onClick={async () => { try { const id = bedDialog.bed?.currentAdmission?.id; if (!id) return; setLedgerDialog(prev => ({ ...prev, open: true, admissionId: id, loading: true })); const r = await fetch(`/api/ipd/ledger?admissionId=${id}`); if (r.ok) { const d = await r.json(); setLedgerDialog(prev => ({ ...prev, loading: false, transactions: d.transactions || [], summary: d.summary || {} })); } else { setLedgerDialog(prev => ({ ...prev, loading: false })); toast.error('Failed to load ledger'); } } catch { setLedgerDialog(prev => ({ ...prev, loading: false })); toast.error('Failed to load ledger'); } }}>View Ledger</Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setBedDialog(prev => ({ ...prev, open: false }))}>Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ledger Dialog */}
        {/* Replaced inline dialog with reusable component */}
        <LedgerDialog
          open={ledgerDialog.open}
          admissionId={ledgerDialog.admissionId}
          onClose={() => setLedgerDialog(prev => ({ ...prev, open: false }))}
          onChanged={async () => { await recalcAdmissionStats(); }}
        />

        {/* Add Charge Dialog */}
        <Dialog open={addCharge.open} onOpenChange={(o) => setAddCharge(prev => ({ ...prev, open: o }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Charge / Service / Medicine</DialogTitle>
              <DialogDescription>Add bill line item for this active admission</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="block text-sm text-gray-700 mb-1">Type</span>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={addCharge.itemType} onChange={(e) => setAddCharge(prev => ({ ...prev, itemType: e.target.value as any }))}>
                  <option value="MEDICINE">Medicine</option>
                  <option value="PROCEDURE">Service / Procedure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <span className="block text-sm text-gray-700 mb-1">Name</span>
                <Input value={addCharge.itemName} onChange={(e) => setAddCharge(prev => ({ ...prev, itemName: e.target.value }))} placeholder="e.g., Injection, Dressing, Paracetamol 500mg" />
              </div>
              <div>
                <span className="block text-sm text-gray-700 mb-1">Quantity</span>
                <Input type="number" min={1} value={addCharge.quantity} onChange={(e) => setAddCharge(prev => ({ ...prev, quantity: parseInt(e.target.value || '1') }))} />
              </div>
              <div>
                <span className="block text-sm text-gray-700 mb-1">Unit Price (₹)</span>
                <Input type="number" min={0} value={addCharge.unitPrice} onChange={(e) => setAddCharge(prev => ({ ...prev, unitPrice: parseFloat(e.target.value || '0') }))} />
              </div>
              <div>
                <span className="block text-sm text-gray-700 mb-1">GST (%)</span>
                <Input type="number" min={0} max={28} value={addCharge.gstRate} onChange={(e) => setAddCharge(prev => ({ ...prev, gstRate: parseFloat(e.target.value || '0') }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddCharge(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button onClick={async () => {
                if (!bedDialog.bed?.currentAdmission) return;
                const patientId = bedDialog.bed.currentAdmission.patient.id;
                const doctorId = bedDialog.bed.currentAdmission.admittedByUser.id || 'UNKNOWN';
                const item = { itemType: addCharge.itemType, itemName: addCharge.itemName, quantity: addCharge.quantity, unitPrice: addCharge.unitPrice, gstRate: addCharge.gstRate };
                if (!item.itemName || item.unitPrice <= 0 || item.quantity <= 0) { toast.error('Enter valid item details'); return; }
                try {
                  const res = await fetch('/api/ipd/ledger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: bedDialog.bed.currentAdmission.id, patientId, type: 'CHARGE', amount: addCharge.unitPrice * addCharge.quantity, description: `${addCharge.itemType}: ${addCharge.itemName} x ${addCharge.quantity}`, reference: `UI:${addCharge.itemType}` }) });
                  if (res.ok) { toast.success('Charge added to ledger'); setAddCharge(prev => ({ ...prev, open: false })); await recalcAdmissionStats(); }
                  else { const err = await res.json().catch(()=>({})); toast.error(err.error || 'Failed to add charge'); }
                } catch { toast.error('Failed to add charge'); }
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="wards" className="cursor-pointer">Ward Management</TabsTrigger>
          <TabsTrigger value="beds" className="cursor-pointer">Bed Type</TabsTrigger>
          <TabsTrigger value="requests" className="cursor-pointer">Admission Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards.map((ward) => (
              <Card key={ward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ward.name}</CardTitle>
                    <Badge variant="outline">{ward.floor}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{ward.department}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span className="font-semibold">{ward.capacity} beds</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-green-600">
                        ✓ Available: {ward.statistics.availableBeds}
                      </div>
                      <div className="text-red-600">
                        ● Occupied: {ward.statistics.occupiedBeds}
                      </div>
                      <div className="text-yellow-600">
                        ⚙ Maintenance: {ward.statistics.maintenanceBeds}
                      </div>
                      <div className="text-gray-600">
                        ⏸ Blocked: {ward.statistics.blockedBeds}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-600">Occupancy Rate</span>
                      <Badge 
                        variant={ward.statistics.occupancyRate > 80 ? "destructive" : 
                               ward.statistics.occupancyRate > 60 ? "secondary" : "default"}
                      >
                        {ward.statistics.occupancyRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search beds, wards, or patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={selectedWard} onValueChange={setSelectedWard}>
              <SelectTrigger className="w-48 bg-white border border-gray-200">
                <SelectValue placeholder="Filter by ward" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all">All Wards</SelectItem>
                {wards.filter(ward => ward.id && ward.id.trim() !== "").map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 bg-white border border-gray-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Beds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <Card key={bed.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setBedDialog({ open: true, bed })}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{bed.bedNumber}</h3>
                      <Badge className={getStatusColor(bed.status)}>
                        {getStatusIcon(bed.status)}
                        <span className="ml-1">{bed.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>Ward:</strong> {bed.ward.name}</p>
                      <p><strong>Type:</strong> {bed.bedType.name}</p>
                      <p><strong>Rate:</strong> ₹{bed.bedType.dailyRate}/day</p>
                    </div>

                    {bed.currentAdmission && (
                      <div className="bg-red-50 p-2 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800">
                          Patient: {bed.currentAdmission.patient.firstName} {bed.currentAdmission.patient.lastName}
                        </p>
                        <p className="text-xs text-red-600">
                          Admitted by: {bed.currentAdmission.admittedByUser.name}
                        </p>
                      </div>
                    )}

                    {bed.notes && (
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">{bed.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBeds.length === 0 && (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No beds found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        {/* Admission Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <AdmissionRequestsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
