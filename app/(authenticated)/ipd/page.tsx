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
import { hasFeature } from "@/lib/edition";

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
                  {wardsList
                    .filter((w: any) => w?.id && String(w.id).trim() !== "")
                    .map((w: any) => (
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
                  {bedsList
                    .filter((b: any) => (!alloc.wardId || b.ward.id === alloc.wardId) && b?.id && String(b.id).trim() !== "")
                    .map((b: any) => (
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
                await loadMeta();
                fetchRequests();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('ipd:refresh'));
                }
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
  
  // Check if user has access to IPD feature
  if (!hasFeature("ipd")) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. IPD Management is not available in your current edition.
          </p>
          <p className="text-center text-gray-500 mt-2">
            Please upgrade to ADVANCED or ENTERPRISE edition to access IPD features.
          </p>
        </CardContent>
      </Card>
    );
  }
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
  type OtImagingItem = { procedureId: string; customName: string; requestedBasePrice: number };
  type MedItem = { name: string; quantity: number };
  const [orderDialog, setOrderDialog] = useState<{ open: boolean; type: 'OT' | 'IMAGING' | 'LAB' | 'PHARMACY'; items: OtImagingItem[]; labTests: string[]; meds: MedItem[]; priority: string; notes: string; loading: boolean }>({ open: false, type: 'OT', items: [{ procedureId: '', customName: '', requestedBasePrice: 0 }], labTests: [''], meds: [{ name: '', quantity: 1 }], priority: 'NORMAL', notes: '', loading: false });
  const [otProcedures, setOtProcedures] = useState<any[]>([]);
  const [imagingProcedures, setImagingProcedures] = useState<any[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Mobile detection and tab state (declare before any conditional return)
  const [isMobile, setIsMobile] = useState(false);
  const [ipdTab, setIpdTab] = useState<string>('wards');

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
        // If bed dialog is open, update it with the refreshed bed data
        setBedDialog(prev => {
          if (!prev.open || !prev.bed) return prev;
          const updated = (bedsData.beds || []).find((b: any) => b.id === prev.bed!.id);
          return updated ? { ...prev, bed: updated } : prev;
        });
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

  useEffect(() => { if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 768); }, []);
  useEffect(() => { if (isMobile) setIpdTab('beds'); }, [isMobile]);

  // Listen for global refresh events (e.g., after allocating a bed from Admission Requests)
  useEffect(() => {
    const handler = () => { fetchIPDData(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('ipd:refresh', handler as any);
      return () => window.removeEventListener('ipd:refresh', handler as any);
    }
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

  const getDisplayStatus = (bed: BedInfo | null | undefined): string => {
    if (!bed) return 'AVAILABLE';
    return bed.currentAdmission ? 'OCCUPIED' : bed.status;
  };

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
    const matchesStatus = selectedStatus === "all" || getDisplayStatus(bed) === selectedStatus;
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
    <div className="container mx-auto p-6 overflow-x-hidden">
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

      <Tabs value={ipdTab} onValueChange={setIpdTab} className="w-full">
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
                <Badge className={getStatusColor(getDisplayStatus(bedDialog.bed))}>
                  {getStatusIcon(getDisplayStatus(bedDialog.bed))}
                  <span className="ml-1">{getDisplayStatus(bedDialog.bed)}</span>
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
            <DialogFooter>
              <div className="flex flex-col space-y-3 w-full">
                {/* Primary action buttons */}
                {bedDialog.bed?.currentAdmission && (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm"
                      onClick={() => setAddCharge({ open: true, itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: 0, gstRate: 0 })}
                    >
                      Add Charge / Service / Medicine
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        // Load masters on open
                        try {
                          const [ot, im] = await Promise.all([
                            fetch('/api/hospital/ot-procedures'),
                            fetch('/api/hospital/imaging-procedures')
                          ]);
                          if (ot.ok) { const d = await ot.json(); setOtProcedures(d.procedures || []); }
                          if (im.ok) { const d = await im.json(); setImagingProcedures(d.procedures || []); }
                        } catch {}
                        setOrderDialog({ open: true, type: 'OT', items: [{ procedureId: '', customName: '', requestedBasePrice: 0 }], labTests: [''], meds: [{ name: '', quantity: 1 }], priority: 'NORMAL', notes: '', loading: false });
                      }}
                    >
                      Create Orders (OT / Imaging / Lab / Pharmacy)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/ipd/ledger/bed-charge', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admissionId: bedDialog.bed?.currentAdmission?.id })
                          });
                          if (res.ok) {
                            toast.success('Posted today\'s bed charge');
                            await recalcAdmissionStats();
                          } else {
                            toast.error('Failed to post bed charge');
                          }
                        } catch {
                          toast.error('Failed to post bed charge');
                        }
                      }}
                    >
                      Post Today&apos;s Bed Charge
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          const id = bedDialog.bed?.currentAdmission?.id;
                          if (!id) return;
                          setLedgerDialog(prev => ({ ...prev, open: true, admissionId: id, loading: true }));
                          const r = await fetch(`/api/ipd/ledger?admissionId=${id}`);
                          if (r.ok) {
                            const d = await r.json();
                            setLedgerDialog(prev => ({
                              ...prev,
                              loading: false,
                              transactions: d.transactions || [],
                              summary: d.summary || {}
                            }));
                          } else {
                            setLedgerDialog(prev => ({ ...prev, loading: false }));
                            toast.error('Failed to load ledger');
                          }
                        } catch {
                          setLedgerDialog(prev => ({ ...prev, loading: false }));
                          toast.error('Failed to load ledger');
                        }
                      }}
                    >
                      View Ledger
                    </Button>
                  </div>
                )}
                
                {/* Secondary actions and close button */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {getDisplayStatus(bedDialog.bed) !== 'OCCUPIED' && (
                      <>
                        {bedDialog.bed?.status !== 'MAINTENANCE' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleMaintenance('MAINTENANCE')}
                          >
                            Put into Maintenance
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleMaintenance('AVAILABLE')}
                          >
                            Mark Available
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setBedDialog(prev => ({ ...prev, open: false }))}
                  >
                    Close
                  </Button>
                </div>
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

        {/* Doctor Orders Dialog */}
        <Dialog open={orderDialog.open} onOpenChange={(o) => setOrderDialog(prev => ({ ...prev, open: o }))}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create IPD Orders</DialogTitle>
              <DialogDescription>Send orders to OT / Imaging / Lab / Pharmacy queues</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="block text-sm text-gray-700 mb-1">Type</span>
                <select className="w-full p-2 border rounded bg-white" value={orderDialog.type} onChange={(e) => setOrderDialog(prev => ({ ...prev, type: e.target.value as any }))}>
                  <option value="OT">OT / Procedure</option>
                  <option value="IMAGING">Imaging</option>
                  <option value="LAB">Lab Tests</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
              </div>
              <div>
                <span className="block text-sm text-gray-700 mb-1">Priority</span>
                <select className="w-full p-2 border rounded bg-white" value={orderDialog.priority} onChange={(e) => setOrderDialog(prev => ({ ...prev, priority: e.target.value }))}>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {(orderDialog.type === 'OT' || orderDialog.type === 'IMAGING') && (
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{orderDialog.type} Items</span>
                    <Button size="sm" variant="outline" onClick={() => setOrderDialog(prev => ({ ...prev, items: [...prev.items, { procedureId: '', customName: '', requestedBasePrice: 0 }] }))}>+ Add Item</Button>
                  </div>
                  {orderDialog.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <select className="p-2 border rounded bg-white md:col-span-2" value={it.procedureId} onChange={(e) => setOrderDialog(prev => ({ ...prev, items: prev.items.map((x,i)=> i===idx?{...x, procedureId: e.target.value }:x) }))}>
                        <option value="">-- Choose from configured list --</option>
                        {(orderDialog.type === 'OT' ? otProcedures : imagingProcedures).map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <Input className="md:col-span-1" placeholder={orderDialog.type==='OT'? 'Custom procedure' : 'Custom study'} value={it.customName} onChange={(e) => setOrderDialog(prev => ({ ...prev, items: prev.items.map((x,i)=> i===idx?{...x, customName: e.target.value }:x) }))} />
                      <Input className="md:col-span-1" type="number" min={0} placeholder="Custom base (₹)" value={it.requestedBasePrice} onChange={(e) => setOrderDialog(prev => ({ ...prev, items: prev.items.map((x,i)=> i===idx?{...x, requestedBasePrice: parseFloat(e.target.value||'0') }:x) }))} />
                      <div className="md:col-span-4 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setOrderDialog(prev => ({ ...prev, items: prev.items.filter((_,i)=> i!==idx) }))}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {orderDialog.type === 'LAB' && (
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Lab Tests</span>
                    <Button size="sm" variant="outline" onClick={() => setOrderDialog(prev => ({ ...prev, labTests: [...prev.labTests, ''] }))}>+ Add Test</Button>
                  </div>
                  {orderDialog.labTests.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input className="flex-1" placeholder="e.g., CBC" value={name} onChange={(e) => setOrderDialog(prev => ({ ...prev, labTests: prev.labTests.map((x,i)=> i===idx? e.target.value : x) }))} />
                      <Button size="sm" variant="ghost" onClick={() => setOrderDialog(prev => ({ ...prev, labTests: prev.labTests.filter((_,i)=> i!==idx) }))}>Remove</Button>
                    </div>
                  ))}
                </div>
              )}

              {orderDialog.type === 'PHARMACY' && (
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Medicines</span>
                    <Button size="sm" variant="outline" onClick={() => setOrderDialog(prev => ({ ...prev, meds: [...prev.meds, { name: '', quantity: 1 }] }))}>+ Add Medicine</Button>
                  </div>
                  {orderDialog.meds.map((m, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <Input className="md:col-span-3" placeholder="e.g., Paracetamol 500mg" value={m.name} onChange={(e) => setOrderDialog(prev => ({ ...prev, meds: prev.meds.map((x,i)=> i===idx?{...x, name: e.target.value }:x) }))} />
                      <Input className="md:col-span-1" type="number" min={1} placeholder="Qty" value={m.quantity} onChange={(e) => setOrderDialog(prev => ({ ...prev, meds: prev.meds.map((x,i)=> i===idx?{...x, quantity: parseInt(e.target.value||'1') }:x) }))} />
                      <div className="md:col-span-4 flex justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setOrderDialog(prev => ({ ...prev, meds: prev.meds.filter((_,i)=> i!==idx) }))}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOrderDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button onClick={async () => {
                const bed = bedDialog.bed;
                const adm = bed?.currentAdmission;
                if (!adm) { toast.error('No active admission'); return; }
                const doctorId = (session?.user as any)?.id || adm.admittedByUser?.id;
                if (!doctorId) { toast.error('Doctor unavailable'); return; }
                setOrderDialog(prev => ({ ...prev, loading: true }));
                try {
                  if (orderDialog.type === 'OT' || orderDialog.type === 'IMAGING') {
                    const url = orderDialog.type === 'OT' ? '/api/ot/requests' : '/api/imaging/requests';
                    const valid = orderDialog.items.filter(it => it.procedureId || it.customName);
                    if (!valid.length) throw new Error('Add at least one item');
                    for (const it of valid) {
                      const body: any = {
                        admissionId: adm.id,
                        patientId: adm.patient.id,
                        doctorId,
                        procedureId: it.procedureId || null,
                        customName: it.customName || null,
                        requestedBasePrice: it.procedureId ? null : (it.requestedBasePrice || 0),
                        priority: orderDialog.priority,
                        notes: orderDialog.notes,
                      };
                      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                      if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Failed to create order'); }
                    }
                    toast.success('Orders sent to queue');
                  } else if (orderDialog.type === 'LAB') {
                    const tests = orderDialog.labTests.map(s => String(s).trim()).filter(Boolean).map(name => ({ name }));
                    if (!tests.length) throw new Error('Add at least one test');
                    const pres = await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: adm.patient.id, labTests: tests, notes: orderDialog.notes }) });
                    if (!pres.ok) { const e = await pres.json().catch(()=>({})); throw new Error(e.error || 'Failed to create prescription'); }
                    const pd = await pres.json();
                    const presId = pd.prescription?.id;
                    if (presId) {
                      await fetch('/api/lab/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: presId, tests: tests.map(t=>t.name) }) });
                    }
                    toast.success('Lab order sent to queue');
                  } else if (orderDialog.type === 'PHARMACY') {
                    const meds = orderDialog.meds.map(m => ({ name: String(m.name).trim(), quantity: Number(m.quantity)||1 })).filter(m => m.name);
                    if (!meds.length) throw new Error('Add at least one medicine');
                    const pres = await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: adm.patient.id, medicines: meds, notes: orderDialog.notes }) });
                    if (!pres.ok) { const e = await pres.json().catch(()=>({})); throw new Error(e.error || 'Failed to create prescription'); }
                    const pd = await pres.json();
                    const presId = pd.prescription?.id;
                    if (presId) {
                      await fetch('/api/pharmacy/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: presId, medicines: meds.map(x=>x.name) }) });
                    }
                    toast.success('Pharmacy order sent to queue');
                  }
                  setOrderDialog({ open: false, type: 'OT', items: [{ procedureId: '', customName: '', requestedBasePrice: 0 }], labTests: [''], meds: [{ name: '', quantity: 1 }], priority: 'NORMAL', notes: '', loading: false });
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to create order');
                  setOrderDialog(prev => ({ ...prev, loading: false }));
                }
              }}>Submit Orders</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
        <TabsList className="w-full overflow-x-auto whitespace-nowrap no-scrollbar [-ms-overflow-style:none] [scrollbar-width:thin]">
          <TabsTrigger value="wards" className="cursor-pointer shrink-0 min-w-[33%] sm:min-w-fit"><Bed className="w-4 h-4 mr-2"/>Ward Management</TabsTrigger>
          <TabsTrigger value="beds" className="cursor-pointer shrink-0 min-w-[33%] sm:min-w-fit"><Activity className="w-4 h-4 mr-2"/>Bed Type</TabsTrigger>
          <TabsTrigger value="requests" className="cursor-pointer shrink-0 min-w-[33%] sm:min-w-fit"><Users className="w-4 h-4 mr-2"/>Admission Requests</TabsTrigger>
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
                      <Badge className={getStatusColor(getDisplayStatus(bed))}>
                        {getStatusIcon(getDisplayStatus(bed))}
                        <span className="ml-1">{getDisplayStatus(bed)}</span>
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
