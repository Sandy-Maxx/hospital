"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import BillForm from "@/components/billing/bill-form";
import BillPrint from "@/components/billing/bill-print";
import EditBillForm from "@/components/billing/edit-bill-form";
import PrescriptionPrint from "@/components/prescriptions/prescription-print";
import LabReportsUpload from "@/components/prescriptions/lab-reports-upload";
import toast from "react-hot-toast";
import { formatBillNumber, formatPrescriptionNumber } from "@/lib/identifiers";
import Breadcrumb from "@/components/navigation/breadcrumb";

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
  const [activeTab, setActiveTab] = useState<"bills" | "prescriptions">(
    "prescriptions",
  );
  const [viewBill, setViewBill] = useState<Bill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [billsCount, setBillsCount] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [prescPage, setPrescPage] = useState(1);
  const [prescLimit, setPrescLimit] = useState(10);

  const fetchBills = async () => {
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
        const uniquePresc = Array.from(
          new Set(
            (data.bills || [])
              .map((b: any) => b.prescription?.id)
              .filter(Boolean),
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
  };

  const fetchBillsCount = async () => {
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
  };

  const fetchPrescriptions = async () => {
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
  };

  useEffect(() => {
    if (activeTab === "bills") {
      fetchBills();
    } else {
      fetchPrescriptions();
      // keep bills count updated even when not on the bills tab
      fetchBillsCount();
    }
  }, [selectedDate, statusFilter, activeTab, page, limit]);

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
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Payment status updated");
      fetchBills();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
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
                              onClick={() =>
                                setSelectedPrescription(prescription)
                              }
                              title="Create Bill"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                              onClick={() =>
                                setPrintPrescription({
                                  id: prescription.id,
                                  open: true,
                                })
                              }
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
                            medsObj = prescription.medicines
                              ? JSON.parse(prescription.medicines)
                              : {};
                          } catch {}
                          const medsCount = Array.isArray(medsObj?.medicines)
                            ? medsObj.medicines.length
                            : Array.isArray(medsObj)
                              ? medsObj.length
                              : 0;
                          const testsCount = Array.isArray(medsObj?.labTests)
                            ? medsObj.labTests.length
                            : 0;
                          const therapiesCount = Array.isArray(
                            medsObj?.therapies,
                          )
                            ? medsObj.therapies.length
                            : 0;
                          return (
                            <>
                              <div>
                                <span className="text-gray-500">
                                  Medicines:
                                </span>
                                <span className="ml-2 font-medium">
                                  {medsCount} items
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Lab Tests:
                                </span>
                                <span className="ml-2 font-medium">
                                  {testsCount} tests
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">
                                  Therapies:
                                </span>
                                <span className="ml-2 font-medium">
                                  {therapiesCount} sessions
                                </span>
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
                  <Button
                    variant="outline"
                    onClick={() => setPrescPage(1)}
                    disabled={prescPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPrescPage((p) => Math.max(1, p - 1))}
                    disabled={prescPage === 1}
                  >
                    Prev
                  </Button>
                  <span className="text-sm">
                    Page {prescPage} of {prescTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPrescPage((p) => Math.min(prescTotalPages, p + 1))
                    }
                    disabled={prescPage >= prescTotalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPrescPage(prescTotalPages)}
                    disabled={prescPage >= prescTotalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Bills for {selectedDate ? formatDate(selectedDate) : "All Dates"}
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
                  <div
                    key={bill.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <Receipt className="w-6 h-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {bill.patient.firstName} {bill.patient.lastName}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="text-gray-700 font-medium">
                                {formatBillNumber({
                                  billNumber: (bill as any).billNumber as any,
                                  id: bill.id,
                                  createdAt: bill.createdAt,
                                })}
                              </span>
                              <span>{bill.patient.phone}</span>
                              <span>{formatDate(bill.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹
                          {(
                            bill.finalAmount ??
                            bill.totalAmount ??
                            0
                          ).toLocaleString()}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {bill.paymentStatus === "PENDING" ||
                          bill.paymentStatus === "REFUNDED" ? (
                            <select
                              value={bill.paymentStatus}
                              onChange={(e) =>
                                updateBillStatus(bill, e.target.value)
                              }
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              title="Update payment status"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PARTIAL">Partial</option>
                              <option value="PAID">Paid</option>
                              <option value="REFUNDED">Refunded</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                paymentStatusColors[
                                  bill.paymentStatus as keyof typeof paymentStatusColors
                                ]
                              }`}
                            >
                              {bill.paymentStatus}
                            </span>
                          )}
                          <span
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            title="Payment method"
                          >
                            {bill.paymentMethod || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Subtotal:</span>
                          <span className="ml-2 font-medium">
                            ₹{(bill.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount:</span>
                          <span className="ml-2 font-medium">
                            ₹{(bill.discountAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Tax (CGST+SGST):
                          </span>
                          <span className="ml-2 font-medium">
                            ₹
                            {(
                              (bill.cgst || 0) + (bill.sgst || 0) || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions - compact icon bar; only enabled when status is PAID or PARTIAL */}
                      {bill.paymentStatus === "PAID" ||
                      bill.paymentStatus === "PARTIAL" ? (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <button
                            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            onClick={() => {
                              setViewBill(bill as any);
                              setShowBillModal(true);
                            }}
                            title="View / Print Bill"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            onClick={() => {
                              setViewBill(bill as any);
                              setShowEditModal(true);
                            }}
                            title="Edit Bill"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => {
                              try {
                                const meds = bill.prescription?.medicines
                                  ? JSON.parse(bill.prescription.medicines)
                                  : {};
                                const tests = (meds.labTests || []).map(
                                  (t: any) => ({ name: t.name }),
                                );
                                setLabUpload({
                                  id: bill.prescription?.id!,
                                  open: true,
                                  tests,
                                });
                              } catch {
                                setLabUpload({
                                  id: bill.prescription?.id!,
                                  open: true,
                                  tests: [],
                                });
                              }
                            }}
                            disabled={
                              !(
                                bill.prescription &&
                                dispatchMap[bill.prescription.id]
                              )
                            }
                            title={
                              !bill.prescription
                                ? "No linked prescription"
                                : !dispatchMap[bill.prescription.id]
                                  ? "Send tests to lab before uploading reports"
                                  : "Upload Lab Reports"
                            }
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            className={`p-2 border rounded-md ${bill.prescription && dispatchMap[bill.prescription.id] ? "border-green-300 text-green-700 bg-green-50 cursor-default" : "border-gray-300 hover:bg-gray-50"}`}
                            onClick={async () => {
                              try {
                                const presId = bill.prescription?.id;
                                if (!presId) {
                                  toast.error("No linked prescription");
                                  return;
                                }
                                const meds = bill.prescription?.medicines
                                  ? JSON.parse(bill.prescription.medicines)
                                  : {};
                                const tests = (meds.labTests || []) as any[];
                                if (!tests.length) {
                                  toast("No lab tests in this bill");
                                  return;
                                }
                                const testNames = tests
                                  .map((t: any) => t.name)
                                  .filter(Boolean);
                                const res = await fetch("/api/lab/dispatch", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    prescriptionId: presId,
                                    tests: testNames,
                                  }),
                                });
                                if (res.ok) {
                                  setDispatchMap((m) => ({
                                    ...m,
                                    [presId]: true,
                                  }));
                                  toast.success("Tests sent to Lab");
                                  fetchBills();
                                } else {
                                  toast.error("Failed to send tests");
                                }
                              } catch {
                                toast.error("Unable to process tests");
                              }
                            }}
                            disabled={
                              !bill.prescription ||
                              !!(
                                bill.prescription &&
                                dispatchMap[bill.prescription.id]
                              )
                            }
                            title={
                              bill.prescription &&
                              dispatchMap[bill.prescription.id]
                                ? "Already sent to Lab"
                                : "Send Tests to Lab"
                            }
                          >
                            <FlaskConical className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => {
                              const presId = bill.prescription?.id;
                              if (!presId) {
                                toast.error("No linked prescription");
                                return;
                              }
                              setPrintPrescription({ id: presId, open: true });
                            }}
                            title="View / Print Prescription"
                            disabled={!bill.prescription?.id}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                            onClick={async () => {
                              const ok =
                                typeof window !== "undefined"
                                  ? window.confirm(
                                      "Delete this bill? This cannot be undone.",
                                    )
                                  : true;
                              if (!ok) return;
                              try {
                                const res = await fetch(
                                  `/api/bills?id=${bill.id}`,
                                  { method: "DELETE" },
                                );
                                if (res.ok) {
                                  toast.success("Bill deleted");
                                  fetchBills();
                                } else {
                                  toast.error("Failed to delete bill");
                                }
                              } catch {
                                toast.error("Failed to delete bill");
                              }
                            }}
                            title="Delete Bill"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 text-right text-xs text-gray-500">
                          Update payment status to enable actions
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && billsCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, billsCount)} of {billsCount}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Per page</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setPage(1);
                      setLimit(parseInt(e.target.value));
                    }}
                    className="p-2 border border-gray-300 rounded-md"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
