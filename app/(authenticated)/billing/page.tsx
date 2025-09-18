"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  FileText,
  Download,
  Printer,
  QrCode,
  Eye,
  Pencil,
  Trash2,
  Upload,
  FlaskConical,
  Check,
  BedDouble,
  IndianRupee,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
const BillForm = dynamic(() => import("@/components/billing/bill-form"), {
  ssr: false,
});
const BillPrint = dynamic(() => import("@/components/billing/bill-print"), {
  ssr: false,
});
const EditBillForm = dynamic(
  () => import("@/components/billing/edit-bill-form"),
  { ssr: false },
);
const PrescriptionPrint = dynamic(
  () => import("@/components/prescriptions/prescription-print"),
  { ssr: false },
);
const LabReportsUpload = dynamic(
  () => import("@/components/prescriptions/lab-reports-upload"),
  { ssr: false },
);
const LedgerDialog = dynamic(() => import("@/components/ipd/ledger-dialog"), { ssr: false });
import toast from "react-hot-toast";
import { formatBillNumber, formatPrescriptionNumber } from "@/lib/identifiers";
import Breadcrumb from "@/components/navigation/breadcrumb";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Subcomponents to simplify the main render
function PrescriptionsSection(props: {
  loading: boolean;
  prescriptions: any[];
  pagedPrescriptions: any[];
  prescPage: number;
  prescLimit: number;
  prescTotalPages: number;
  setPrescPage: (n: any) => void;
  setPrescLimit: (n: any) => void;
  setSelectedPrescription: (p: any) => void;
  setPrintPrescription: (v: any) => void;
}) {
  const { loading, prescriptions, pagedPrescriptions, prescPage, prescLimit, prescTotalPages, setPrescPage, setPrescLimit, setSelectedPrescription, setPrintPrescription } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Prescriptions for Billing</CardTitle>
        <CardDescription>
          {prescriptions.length} prescriptions awaiting billing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48" />
                    <div className="h-3 bg-gray-200 rounded w-40" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No pending prescriptions for billing
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagedPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {prescription.patient.firstName}{" "}
                          {prescription.patient.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Dr. {prescription.doctor.name}</span>
                          <span>{prescription.patient.phone}</span>
                          <span>{formatDate(prescription.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          onClick={() => setSelectedPrescription(prescription)}
                          title="Create Bill"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          onClick={() => setPrintPrescription({ id: prescription.id, open: true })}
                          title="View / Print Prescription"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm text-gray-500">
                        {prescription.doctor.department}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {(() => {
                      let medsObj: any = {};
                      try {
                        medsObj = prescription.medicines ? JSON.parse(prescription.medicines) : {};
                      } catch {}
                      const medsCount = Array.isArray(medsObj?.medicines)
                        ? medsObj.medicines.length
                        : Array.isArray(medsObj)
                          ? medsObj.length
                          : 0;
                      const testsCount = Array.isArray(medsObj?.labTests)
                        ? medsObj.labTests.length
                        : 0;
                      const therapiesCount = Array.isArray(medsObj?.therapies)
                        ? medsObj.therapies.length
                        : 0;
                      return (
                        <>
                          <div>
                            <span className="text-gray-500">Medicines:</span>
                            <span className="ml-2 font-medium">{medsCount} items</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Lab Tests:</span>
                            <span className="ml-2 font-medium">{testsCount} tests</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Therapies:</span>
                            <span className="ml-2 font-medium">{therapiesCount} sessions</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && prescriptions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Showing {(prescPage - 1) * prescLimit + 1} -{" "}
              {Math.min(prescPage * prescLimit, prescriptions.length)} of{" "}
              {prescriptions.length}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page</label>
              <select
                value={prescLimit}
                onChange={(e) => {
                  setPrescPage(1);
                  setPrescLimit(parseInt(e.target.value));
                }}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPrescPage(1)} disabled={prescPage === 1}>First</Button>
              <Button variant="outline" onClick={() => setPrescPage((p: number) => Math.max(1, p - 1))} disabled={prescPage === 1}>Prev</Button>
              <span className="text-sm">Page {prescPage} of {prescTotalPages}</span>
              <Button variant="outline" onClick={() => setPrescPage((p: number) => Math.min(prescTotalPages, p + 1))} disabled={prescPage >= prescTotalPages}>Next</Button>
              <Button variant="outline" onClick={() => setPrescPage(prescTotalPages)} disabled={prescPage >= prescTotalPages}>Last</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BillsSection(props: {
  loading: boolean;
  bills: any[];
  billsCount: number;
  page: number;
  limit: number;
  totalPages: number;
  setPage: (n: any) => void;
  setLimit: (n: any) => void;
  updateBillStatus: (bill: any, status: string) => void;
  updatingBills: Set<string>;
  setViewBill: (b: any) => void;
  setShowBillModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  dispatchMap: Record<string, boolean>;
  setDispatchMap: (fn: any) => void;
  setLabUpload: (v: any) => void;
  fetchBills: () => void;
}) {
  const { loading, bills, billsCount, page, limit, totalPages, setPage, setLimit, updateBillStatus, updatingBills, setViewBill, setShowBillModal, setShowEditModal, dispatchMap, setDispatchMap, setLabUpload, fetchBills } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Bills for {/* date heading handled by parent */}
        </CardTitle>
        <CardDescription>{bills.length} bills found</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40" />
                      <div className="h-3 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bills found for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bill.patient.firstName} {bill.patient.lastName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="text-gray-700 font-medium">{formatBillNumber({ billNumber: bill.billNumber, id: bill.id, createdAt: bill.createdAt })}</span>
                          <span>{bill.patient.phone}</span>
                          <span>{formatDate(bill.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">₹{(bill.finalAmount ?? bill.totalAmount ?? 0).toLocaleString()}</div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Select value={bill.paymentStatus} onValueChange={(newStatus) => updateBillStatus(bill, newStatus)} disabled={updatingBills.has(bill.id)}>
                        <SelectTrigger className={`w-24 h-8 text-xs bg-white border border-gray-300 ${updatingBills.has(bill.id) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder={bill.paymentStatus} />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                          <SelectItem value="PENDING" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Pending</SelectItem>
                          <SelectItem value="PARTIAL" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Partial</SelectItem>
                          <SelectItem value="PAID" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Paid</SelectItem>
                          <SelectItem value="REFUNDED" className="text-gray-900 bg-white hover:bg-gray-100 focus:bg-gray-100">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs" title="Payment method">{bill.paymentMethod || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Subtotal:</span><span className="ml-2 font-medium">₹{(bill.totalAmount || 0).toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Discount:</span><span className="ml-2 font-medium">₹{(bill.discountAmount || 0).toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Tax (CGST+SGST):</span><span className="ml-2 font-medium">₹{(((bill.cgst || 0) + (bill.sgst || 0)) || 0).toLocaleString()}</span></div>
                  </div>
                  {(bill.paymentStatus === 'PAID' || bill.paymentStatus === 'PARTIAL') ? (
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => { setViewBill(bill); setShowBillModal(true); }} title="View / Print Bill"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => { setViewBill(bill); setShowEditModal(true); }} title="Edit Bill"><Pencil className="w-4 h-4" /></button>
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" onClick={() => {
                        try {
                          const meds = bill.prescription?.medicines ? JSON.parse(bill.prescription.medicines) : {};
                          const tests = (meds.labTests || []).map((t: any) => ({ name: t.name }));
                          setLabUpload({ id: bill.prescription?.id!, open: true, tests });
                        } catch {
                          setLabUpload({ id: bill.prescription?.id!, open: true, tests: [] });
                        }
                      }} disabled={!(bill.prescription && dispatchMap[bill.prescription.id])} title={!bill.prescription ? 'No linked prescription' : (!dispatchMap[bill.prescription.id] ? 'Send tests to lab before uploading reports' : 'Upload Lab Reports')}><Upload className="w-4 h-4" /></button>
                      <button className={`p-2 border rounded-md ${bill.prescription && dispatchMap[bill.prescription.id] ? 'border-green-300 text-green-700 bg-green-50 cursor-default' : 'border-gray-300 hover:bg-gray-50'}`} onClick={async () => {
                        try {
                          const presId = bill.prescription?.id;
                          if (!presId) { toast.error('No linked prescription'); return; }
                          const meds = bill.prescription?.medicines ? JSON.parse(bill.prescription.medicines) : {};
                          const tests = (meds.labTests || []) as any[];
                          if (!tests.length) { toast('No lab tests in this bill'); return; }
                          const testNames = tests.map((t: any) => t.name).filter(Boolean);
                          const res = await fetch('/api/lab/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: presId, tests: testNames }) });
                          if (res.ok) { setDispatchMap((m: any) => ({ ...m, [presId]: true })); toast.success('Tests sent to Lab'); fetchBills(); } else { toast.error('Failed to send tests'); }
                        } catch { toast.error('Unable to process tests'); }
                      }} disabled={!bill.prescription || !!(bill.prescription && dispatchMap[bill.prescription.id])} title={bill.prescription && dispatchMap[bill.prescription.id] ? 'Already sent to Lab' : 'Send Tests to Lab'}><FlaskConical className="w-4 h-4" /></button>
                      <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50" onClick={() => { const presId = bill.prescription?.id; if (!presId) { toast.error('No linked prescription'); return; } /* moved to section-level modal */ }} title="View / Print Prescription" disabled={!bill.prescription?.id}><Download className="w-4 h-4" /></button>
                      <button className="p-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50" onClick={async () => { const ok = typeof window !== 'undefined' ? window.confirm('Delete this bill? This cannot be undone.') : true; if (!ok) return; try { const res = await fetch(`/api/bills?id=${bill.id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Bill deleted'); fetchBills(); } else { toast.error('Failed to delete bill'); } } catch { toast.error('Failed to delete bill'); } }} title="Delete Bill"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="mt-4 text-right text-xs text-gray-500">Update payment status to enable actions</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && billsCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">Showing {(page - 1) * limit + 1} - {Math.min(page * limit, billsCount)} of {billsCount}</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per page</label>
              <select value={limit} onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value)); }} className="p-2 border border-gray-300 rounded-md">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
              <Button variant="outline" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
              <Button variant="outline" onClick={() => setPage(totalPages)} disabled={page >= totalPages}>Last</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IPDSection(props: {
  loading: boolean;
  ipdRequests: any[];
  onCollectAdvance: (req: any) => void;
  activeAdmissions: any[];
  onFinalize: (adm: any, days: number, amount: number) => void;
  onDischarge: (adm: any) => void;
  onAddCharge: (adm: any) => void;
  onViewLedger: (adm: any) => void;
  runningMap?: Record<string, { days: number; rate: number; bedCharges: number; advancePaid: number; totalPaid: number; netDue: number }>;
}) {
  const { loading, ipdRequests, onCollectAdvance, activeAdmissions, onFinalize, onDischarge, onAddCharge, onViewLedger, runningMap = {} } = props;
  const msPerDay = 24 * 60 * 60 * 1000;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><BedDouble className="w-5 h-5 mr-2"/>IPD Admissions Awaiting Deposit</CardTitle>
          <CardDescription>Collect advance and mark deposit paid</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : ipdRequests.length === 0 ? (
            <div className="text-center py-8">
              <BedDouble className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No admissions awaiting deposit</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ipdRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-gray-900">{req.patient.firstName} {req.patient.lastName} <span className="text-xs text-gray-500">({req.patient.phone})</span></div>
                    <div className="text-xs text-gray-600">Doctor: Dr. {req.doctor.name} • Ward: {req.wardType || '-'} • Bed: {req.bedType || '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onCollectAdvance(req)}><IndianRupee className="w-4 h-4 mr-1"/> Collect Advance</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Admissions - Running Accounts</CardTitle>
          <CardDescription>Advance paid vs current bed charges</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : activeAdmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active admissions</div>
          ) : (
            <div className="space-y-3">
              {activeAdmissions.map((adm) => {
                const since = new Date(adm.admissionDate);
                const now = new Date();
                const days = runningMap[adm.id]?.days ?? Math.max(1, Math.ceil((now.getTime() - since.getTime()) / msPerDay));
                const rate = runningMap[adm.id]?.rate ?? Number(adm.bed?.bedType?.dailyRate || 0);
                const bedCharges = runningMap[adm.id]?.bedCharges ?? rate * days;
                const advancePaid = runningMap[adm.id]?.advancePaid ?? 0;
                const netDue = runningMap[adm.id]?.netDue ?? Math.max(0, bedCharges - advancePaid);
                return (
                  <div key={adm.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{adm.patient.firstName} {adm.patient.lastName} • {adm.bed?.ward?.name} - {adm.bed?.bedNumber}</div>
                      <div className="text-xs text-gray-600">Since {since.toLocaleString()} • Rate ₹{rate}/day • Days {days}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Advance: ₹{advancePaid.toLocaleString()}</div>
                      <div className="text-sm">Bed Charges: ₹{bedCharges.toLocaleString()}</div>
                      <div className="font-semibold">Net Due: ₹{netDue.toLocaleString()}</div>
                      <div className="mt-2 flex gap-2 justify-end">
                        <Button size="sm" onClick={() => onAddCharge(adm)}>Add Charge</Button>
<Button size="sm" variant="outline" onClick={async () => { try { const res = await fetch('/api/ipd/ledger/bed-charge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: adm.id }) }); if (res.ok) { toast.success("Posted today's bed charge"); } else { toast.error('Failed to post bed charge'); } } catch { toast.error('Failed to post bed charge'); } }}>Post Today&apos;s Bed Charge</Button>
<Button size="sm" variant="outline" onClick={() => onViewLedger(adm)}>View Ledger</Button>
                        <Button size="sm" variant="outline" onClick={async () => { try { const res = await fetch('/api/ipd/finalize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: adm.id }) }); if (res.ok) { toast.success('Final bill created'); } else { toast.error('Failed to finalize'); } } catch { toast.error('Failed to finalize'); } }}>Finalize & Generate Final Bill</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDischarge(adm)}>Mark Discharged</Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface Bill {
  id: string;
  billNumber: string;
  totalAmount: number;
  cgst?: number;
  sgst?: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor?: {
    name: string;
    department?: string;
  };
  billItems?: Array<{
    itemType: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    gstRate?: number;
  }>;
  prescription?: {
    id: string;
    medicines?: string;
  };
}

const paymentStatusColors = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PARTIAL: "bg-orange-100 text-orange-800",
  REFUNDED: "bg-red-100 text-red-800",
};

export default function Billing() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [dispatchMap, setDispatchMap] = useState<Record<string, boolean>>({});
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [printPrescription, setPrintPrescription] = useState<{
    id: string;
    open: boolean;
  } | null>(null);
  const [labUpload, setLabUpload] = useState<{
    id: string;
    open: boolean;
    tests: { name: string }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'bills' | 'ipd'>(() => 'prescriptions');
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [billsCount, setBillsCount] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [prescPage, setPrescPage] = useState(1);
  const [prescLimit, setPrescLimit] = useState(10);
  const [updatingBills, setUpdatingBills] = useState<Set<string>>(new Set());

  // IPD Awaiting Deposit states
  const [ipdRequests, setIpdRequests] = useState<any[]>([]);
  const [depositDialog, setDepositDialog] = useState<{ open: boolean; req: any | null; amount: number; method: string }>({ open: false, req: null, amount: 0, method: "CASH" });
  // Running accounts (ACTIVE admissions)
  const [activeAdmissions, setActiveAdmissions] = useState<any[]>([]);
  const [finalizeDialog, setFinalizeDialog] = useState<{ open: boolean; adm: any | null; days: number; amount: number }>({ open: false, adm: null, days: 0, amount: 0 });
  // Add charge dialog for active admissions
  const [addChargeDialog, setAddChargeDialog] = useState<{ open: boolean; adm: any | null; itemType: 'MEDICINE'|'PROCEDURE'|'OTHER'; itemName: string; quantity: number; unitPrice: number; gstRate: number }>({ open: false, adm: null, itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: 0, gstRate: 0 });
  const [runningMap, setRunningMap] = useState<Record<string, { days: number; rate: number; bedCharges: number; advancePaid: number; totalPaid: number; netDue: number }>>({});
  const [ledger, setLedger] = useState<{ open: boolean; admissionId: string | null }>({ open: false, admissionId: null });

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const response = await fetch(`/api/bills?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBills(data.bills);
        if (data.pagination?.total !== undefined)
          setBillsCount(data.pagination.total);
        if (data.pagination?.pages !== undefined)
          setTotalPages(data.pagination.pages);
        // Prefetch dispatch status for bills' prescriptions
        const uniquePresc: string[] = Array.from(
          new Set<string>(
            ((data.bills || []) as any[])
              .map((b) => (b as any).prescription?.id as string | undefined)
              .filter((id): id is string => !!id),
          ),
        );
        if (uniquePresc.length) {
          await Promise.all(
            uniquePresc.map(async (pid: string) => {
              try {
                const res = await fetch(
                  `/api/lab/dispatch?prescriptionId=${pid}`,
                );
                if (res.ok) {
                  const d = await res.json();
                  setDispatchMap((m) => ({ ...m, [pid]: !!d.allDispatched }));
                }
              } catch {}
            }),
          );
        }
      } else {
        toast.error("Failed to fetch bills");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, page, limit]);

  const fetchBillsCount = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", "1");
      params.set("limit", "1");
      const response = await fetch(`/api/bills?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.pagination?.total !== undefined)
          setBillsCount(data.pagination.total);
      }
    } catch {}
  }, [selectedDate, statusFilter]);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.set("date", selectedDate);

      const response = await fetch(
        `/api/prescriptions/pending-billing?${params}`,
      );
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        toast.error("Failed to fetch prescriptions");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab === "bills") {
      fetchBills();
    } else if (activeTab === "prescriptions") {
      fetchPrescriptions();
      // keep bills count updated even when not on the bills tab
      fetchBillsCount();
    } else if (activeTab === "ipd") {
      (async () => {
        try {
          setLoading(true);
          const [reqRes, admRes] = await Promise.all([
            fetch('/api/ipd/admission-requests?status=AWAITING_DEPOSIT'),
            fetch('/api/ipd/admissions?status=ACTIVE'),
          ]);
          if (reqRes.ok) {
            const data = await reqRes.json();
            setIpdRequests(data.admissionRequests || []);
          }
          if (admRes.ok) {
            const data = await admRes.json();
            const adms = data.admissions || [];
            setActiveAdmissions(adms);
            // Compute running totals per admission
            const map: Record<string, any> = {};
            await Promise.all(adms.map(async (adm: any) => {
              const since = new Date(adm.admissionDate || adm.createdAt);
              const now = new Date();
              const days = Math.max(1, Math.ceil((now.getTime() - since.getTime()) / (24*60*60*1000)));
              const rate = Number(adm.bed?.bedType?.dailyRate || 0);
              const bedCharges = days * rate;
              let advancePaid = 0;
              let totalPaid = 0;
              try {
                const billsRes = await fetch(`/api/bills?patientId=${adm.patient.id}`);
                if (billsRes.ok) {
                  const b = await billsRes.json();
                  const bills = b.bills || [];
                  bills.forEach((bill: any) => {
                    const created = new Date(bill.createdAt);
                    if (created >= since) {
                      const paid = bill.paymentStatus === 'PAID' ? (bill.finalAmount ?? bill.totalAmount ?? 0) : 0;
                      totalPaid += paid;
                      const isDeposit = (bill.billItems || []).some((it: any) => String(it.itemName || '').toLowerCase().includes('deposit')) || String(bill.notes||'').toLowerCase().includes('deposit');
                      if (isDeposit) advancePaid += paid;
                    }
                  });
                }
              } catch {}
              const netDue = Math.max(0, bedCharges - advancePaid);
              map[adm.id] = { days, rate, bedCharges, advancePaid, totalPaid, netDue };
            }));
            setRunningMap(map);
          }
        } catch {}
        finally { setLoading(false); }
      })();
    }
  }, [activeTab, fetchBills, fetchPrescriptions, fetchBillsCount]);

  // Reset pages when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    setPrescPage(1);
  }, [selectedDate]);

  // Initial prefetch counts
  useEffect(() => {
    fetchBillsCount();
    // Prefetch IPD counts so tab badges are accurate without clicking
    (async () => {
      try {
        const [reqRes, admRes] = await Promise.all([
          fetch('/api/ipd/admission-requests?status=AWAITING_DEPOSIT'),
          fetch('/api/ipd/admissions?status=ACTIVE'),
        ]);
        if (reqRes.ok) {
          const d = await reqRes.json();
          setIpdRequests(d.admissionRequests || []);
        }
        if (admRes.ok) {
          const d = await admRes.json();
          setActiveAdmissions(d.admissions || []);
        }
      } catch {}
    })();
  }, []);

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidBills = bills.filter((bill) => bill.paymentStatus === "PAID");
  const pendingBills = bills.filter((bill) => bill.paymentStatus === "PENDING");
  const prescTotalPages = Math.max(
    1,
    Math.ceil((prescriptions.length || 0) / prescLimit),
  );
  const pagedPrescriptions = prescriptions.slice(
    (prescPage - 1) * prescLimit,
    prescPage * prescLimit,
  );

  const updateBillStatus = async (bill: Bill, status: string) => {
    // Add to updating set
    setUpdatingBills(prev => new Set(prev).add(bill.id));

    // Store the original state for potential revert
    const originalBills = bills;

    // Optimistically update the UI immediately
    const updatedBills = bills.map(b => b.id === bill.id ? { ...b, paymentStatus: status } : b);
    setBills(updatedBills);

    try {
      const payload: any = { paymentStatus: status };
      if (status === "PAID") {
        const amt = bill.finalAmount ?? bill.totalAmount ?? 0;
        payload.paidAmount = amt;
        payload.balanceAmount = 0;
      }
      const res = await fetch(`/api/bills?id=${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Revert optimistic update if the API call fails
        setBills(originalBills);
        throw new Error("Failed to update status");
      }
      toast.success("Payment status updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
      // Revert the optimistic update
      setBills(originalBills);
    } finally {
      // Remove from updating set
      setUpdatingBills(prev => {
        const newSet = new Set(prev);
        newSet.delete(bill.id);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Billing", href: "/billing" }]} />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-primary-600" />
            Billing & Payments
          </h1>
          <p className="text-gray-600 mt-2">
            Manage patient bills and payment records
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "prescriptions" ? "default" : "outline"}
            onClick={() => setActiveTab("prescriptions")}
          >
            <FileText className="w-4 h-4 mr-2" />
            Pending Prescriptions ({prescriptions.length})
          </Button>
          <Button
            variant={activeTab === "bills" ? "default" : "outline"}
            onClick={() => setActiveTab("bills")}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Bills ({billsCount})
          </Button>
          <Button
            variant={activeTab === "ipd" ? "default" : "outline"}
            onClick={() => setActiveTab("ipd")}
          >
            <BedDouble className="w-4 h-4 mr-2" />
            IPD Admissions ({ipdRequests.length})
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Revenue
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalRevenue.toLocaleString()}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bills.length}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Bills</p>
                <p className="text-2xl font-bold text-green-600">
                  {paidBills.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingBills.length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-bold">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on active tab */}
      {activeTab === "prescriptions" ? (
        <PrescriptionsSection
          loading={loading}
          prescriptions={prescriptions}
          pagedPrescriptions={pagedPrescriptions}
          prescPage={prescPage}
          prescLimit={prescLimit}
          prescTotalPages={prescTotalPages}
          setPrescPage={setPrescPage as any}
          setPrescLimit={setPrescLimit as any}
          setSelectedPrescription={setSelectedPrescription as any}
          setPrintPrescription={setPrintPrescription as any}
        />
      ) : activeTab === "bills" ? (
        <BillsSection
          loading={loading}
          bills={bills}
          billsCount={billsCount}
          page={page}
          limit={limit}
          totalPages={totalPages}
          setPage={setPage as any}
          setLimit={setLimit as any}
          updateBillStatus={updateBillStatus as any}
          updatingBills={updatingBills}
          setViewBill={setViewBill as any}
          setShowBillModal={setShowBillModal}
          setShowEditModal={setShowEditModal}
          dispatchMap={dispatchMap}
          setDispatchMap={setDispatchMap as any}
          setLabUpload={setLabUpload as any}
          fetchBills={fetchBills}
        />
      ) : (
        <IPDSection
          loading={loading}
          ipdRequests={ipdRequests}
          onCollectAdvance={(req: any) => setDepositDialog({ open: true, req, amount: 0, method: 'CASH' })}
          activeAdmissions={activeAdmissions}
          onFinalize={(adm: any, days: number, amount: number) => setFinalizeDialog({ open: true, adm, days, amount })}
          onDischarge={async (adm: any) => {
            const ok = typeof window !== 'undefined' ? window.confirm('Mark admission as Discharged? Ensure final bill is cleared.') : true;
            if (!ok) return;
            try {
              const res = await fetch('/api/ipd/admissions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: adm.id, status: 'DISCHARGED' }) });
              if (res.ok) {
                toast.success('Admission marked Discharged');
                const a = await fetch('/api/ipd/admissions?status=ACTIVE');
                if (a.ok) { const d = await a.json(); setActiveAdmissions(d.admissions || []); }
              } else { toast.error('Failed to discharge'); }
            } catch {}
          }}
          onAddCharge={(adm: any) => setAddChargeDialog({ open: true, adm, itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: 0, gstRate: 0 })}
          onViewLedger={(adm: any) => setLedger({ open: true, admissionId: adm.id })}
          runningMap={runningMap}
        />
      )}

      {/* Collect Deposit Dialog */}
      <Dialog open={depositDialog.open} onOpenChange={(o) => setDepositDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Advance Deposit</DialogTitle>
            <DialogDescription>Record the advance payment for IPD admission</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <Input type="number" min={0} value={depositDialog.amount} onChange={e => setDepositDialog(prev => ({ ...prev, amount: parseFloat(e.target.value || '0') }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="w-full p-2 border border-gray-300 rounded-md" value={depositDialog.method} onChange={e => setDepositDialog(prev => ({ ...prev, method: e.target.value }))}>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={async () => {
              const req = depositDialog.req;
              if (!req) return;
              const amount = depositDialog.amount || 0;
              if (amount <= 0) { toast.error('Enter a valid amount'); return; }
              try {
                // 1) Create a bill with a deposit line
                const createRes = await fetch('/api/bills', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    patientId: req.patientId,
                    prescriptionId: req.prescriptionId,
                    doctorId: req.doctorId,
                    items: [{ itemType: 'OTHER', itemName: 'IPD Advance Deposit', quantity: 1, unitPrice: amount, gstRate: 0 }],
                    discountAmount: 0,
                    paymentMethod: depositDialog.method,
                    notes: 'IPD Advance Deposit for admission request'
                  })
                });
                if (!createRes.ok) { const e = await createRes.json().catch(()=>({})); throw new Error(e.error || 'Failed to create bill'); }
                const bill = await createRes.json();
                const final = bill.finalAmount ?? bill.totalAmount ?? amount;
                // 2) Mark bill as paid fully
                const putRes = await fetch(`/api/bills?id=${bill.id || bill.bill?.id || ''}`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentStatus: 'PAID', paidAmount: final, balanceAmount: 0 })
                });
                if (!putRes.ok) { throw new Error('Failed to mark bill paid'); }
                // 3) Update admission request status to DEPOSIT_PAID
                await fetch('/api/ipd/admission-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prescriptionId: req.prescriptionId, status: 'DEPOSIT_PAID' }) });
                toast.success('Advance deposit collected');
                setDepositDialog(prev => ({ ...prev, open: false }));
                // Refresh list
                if (activeTab === 'ipd') {
                  try {
                    const res = await fetch('/api/ipd/admission-requests?status=AWAITING_DEPOSIT');
                    const data = await res.json();
                    if (res.ok) setIpdRequests(data.admissionRequests || []);
                  } catch {}
                }
              } catch (e: any) {
                toast.error(e?.message || 'Failed to collect deposit');
              }
            }}>Collect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize & Generate Final Bill Dialog */}
      <Dialog open={finalizeDialog.open} onOpenChange={(o) => setFinalizeDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize IPD Bill</DialogTitle>
            <DialogDescription>Compute final bed charges up to now and create a bill</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm text-gray-700">Patient: {finalizeDialog.adm ? `${finalizeDialog.adm.patient.firstName} ${finalizeDialog.adm.patient.lastName}` : '-'}</div>
            <div className="text-sm text-gray-700">Bed Rate: ₹{finalizeDialog.adm?.bed?.bedType?.dailyRate || 0} / day</div>
            <div className="text-sm text-gray-700">Days: {finalizeDialog.days}</div>
            <div className="font-semibold">Bed Charges: ₹{finalizeDialog.amount.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Note: Advance deposits are considered separately. After bill creation, settle amounts and then discharge.</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={async () => {
              const adm = finalizeDialog.adm;
              if (!adm) return;
              const amount = finalizeDialog.amount;
              try {
                const res = await fetch('/api/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                  patientId: adm.patientId,
                  doctorId: adm.admittedByUser?.id || 'UNKNOWN',
                  items: [{ itemType: 'OTHER', itemName: `Bed charges (${finalizeDialog.days} days @ ₹${adm.bed?.bedType?.dailyRate}/day)`, quantity: 1, unitPrice: amount, gstRate: 0 }],
                  discountAmount: 0,
                  paymentMethod: 'PENDING',
                  notes: `Final IPD bed charges for admission ${adm.id}`,
                }) });
                if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error || 'Failed to create bill'); }
                toast.success('Final bill created');
                setFinalizeDialog(prev => ({ ...prev, open: false }));
              } catch (e: any) {
                toast.error(e?.message || 'Failed to create final bill');
              }
            }}>Create Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Form Modal */}
      {selectedPrescription && (
        <BillForm
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescription(null)}
          onSuccess={() => {
            fetchPrescriptions();
            fetchBills();
          }}
        />
      )}
      {/* Bill Print Modal */}
      <BillPrint
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        bill={viewBill}
      />
      {/* Prescription Print Modal */}
      {printPrescription && (
        <PrescriptionPrint
          open={printPrescription.open}
          onClose={() => setPrintPrescription(null)}
          id={printPrescription.id}
        />
      )}
      {/* Lab Reports Upload Modal */}
      {labUpload && (
        <LabReportsUpload
          open={labUpload.open}
          onClose={() => setLabUpload(null)}
          prescriptionId={labUpload.id}
          labTests={labUpload.tests}
        />
      )}
      {/* Ledger Dialog */}
      <LedgerDialog
        open={ledger.open}
        admissionId={ledger.admissionId}
        onClose={() => setLedger({ open: false, admissionId: null })}
      />

      {/* Add Charge Dialog */}
      <Dialog open={addChargeDialog.open} onOpenChange={(o) => setAddChargeDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Charge / Service / Medicine</DialogTitle>
            <DialogDescription>Add to running account for active admission</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Type</label>
              <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={addChargeDialog.itemType} onChange={(e) => setAddChargeDialog(prev => ({ ...prev, itemType: e.target.value as any }))}>
                <option value="MEDICINE">Medicine</option>
                <option value="PROCEDURE">Service / Procedure</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <Input value={addChargeDialog.itemName} onChange={(e) => setAddChargeDialog(prev => ({ ...prev, itemName: e.target.value }))} placeholder="e.g., Injection, Dressing, Paracetamol 500mg" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Quantity</label>
              <Input type="number" min={1} value={addChargeDialog.quantity} onChange={(e) => setAddChargeDialog(prev => ({ ...prev, quantity: parseInt(e.target.value || '1') }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Unit Price (₹)</label>
              <Input type="number" min={0} value={addChargeDialog.unitPrice} onChange={(e) => setAddChargeDialog(prev => ({ ...prev, unitPrice: parseFloat(e.target.value || '0') }))} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">GST (%)</label>
              <Input type="number" min={0} max={28} value={addChargeDialog.gstRate} onChange={(e) => setAddChargeDialog(prev => ({ ...prev, gstRate: parseFloat(e.target.value || '0') }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddChargeDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button onClick={async () => {
              const adm = addChargeDialog.adm; if (!adm) return;
              const patientId = adm.patientId || adm.patient?.id;
              const doctorId = adm.admittedByUser?.id || 'UNKNOWN';
              const item = { itemType: addChargeDialog.itemType, itemName: addChargeDialog.itemName, quantity: addChargeDialog.quantity, unitPrice: addChargeDialog.unitPrice, gstRate: addChargeDialog.gstRate };
              if (!item.itemName || item.unitPrice <= 0 || item.quantity <= 0) { toast.error('Enter valid item details'); return; }
              try {
                const res = await fetch('/api/ipd/ledger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId: adm.id, patientId, type: 'CHARGE', amount: addChargeDialog.unitPrice * addChargeDialog.quantity, description: `${addChargeDialog.itemType}: ${addChargeDialog.itemName} x ${addChargeDialog.quantity}`, reference: `UI:${addChargeDialog.itemType}` }) });
                if (res.ok) { toast.success('Charge added to ledger'); setAddChargeDialog(prev => ({ ...prev, open: false })); setActiveTab('ipd'); }
                else { const err = await res.json().catch(()=>({})); toast.error(err.error || 'Failed to add charge'); }
              } catch { toast.error('Failed to add charge'); }
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Modal */}
      <EditBillForm
        isOpen={showEditModal}
        bill={viewBill as any}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          fetchBills();
        }}
      />
    </div>
  );
}
