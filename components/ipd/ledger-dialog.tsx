"use client";

import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface LedgerDialogProps {
  open: boolean;
  admissionId: string | null;
  onClose: () => void;
  // Optional: callback after posting a transaction or bed charge
  onChanged?: () => void;
}

export default function LedgerDialog(props: LedgerDialogProps) {
  const { open, admissionId, onClose, onChanged } = props;
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [admission, setAdmission] = useState<any>(null);

  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<'DEPOSIT'|'PAYMENT'|'REFUND'|'ADJUSTMENT'>('DEPOSIT');
  const [method, setMethod] = useState<'CASH'|'CARD'|'UPI'|'ONLINE'>('CASH');

  const loadLedger = useCallback(async () => {
    if (!admissionId) return;
    try {
      setLoading(true);
      const r = await fetch(`/api/ipd/ledger?admissionId=${admissionId}`);
      if (!r.ok) throw new Error('Failed');
      const d = await r.json();
      setTransactions(d.transactions || []);
      setSummary(d.summary || {});
      setAdmission(d.admission || null);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [admissionId]);

  useEffect(() => {
    if (open && admissionId) {
      loadLedger();
    }
  }, [open, admissionId, loadLedger]);

  const addTxn = async () => {
    if (!admissionId || !admission) return;
    if (!amount || amount <= 0) { toast.error('Enter valid amount'); return; }
    try {
      const r = await fetch('/api/ipd/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionId, patientId: admission.patient?.id || admission.patientId, type, amount, paymentMethod: method, description: `${type} via ${method}` }),
      });
      if (!r.ok) {
        const er = await r.json().catch(()=>({}));
        throw new Error(er.error || 'Failed');
      }
      toast.success(`${type} added`);
      await loadLedger();
      onChanged?.();
      setAmount(0);
    } catch (e: any) {
      toast.error(e?.message || 'Failed');
    }
  };

  const postBedCharge = async () => {
    if (!admissionId) return;
    try {
      const res = await fetch('/api/ipd/ledger/bed-charge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId })
      });
      if (res.ok) {
        toast.success("Posted today's bed charge");
        await loadLedger();
        onChanged?.();
      } else {
        toast.error('Failed to post bed charge');
      }
    } catch {
      toast.error('Failed to post bed charge');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Admission Ledger</DialogTitle>
          <DialogDescription>All charges, deposits, and payments for this admission</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading ledger...</div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Total Charges</div>
                <div className="text-lg font-semibold text-gray-900">₹{Number(summary?.totalCharges || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Deposits</div>
                <div className="text-lg font-semibold text-green-700">₹{Number(summary?.totalDeposits || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Payments</div>
                <div className="text-lg font-semibold text-green-700">₹{Number(summary?.totalPayments || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Refunds</div>
                <div className="text-lg font-semibold text-red-700">₹{Number(summary?.totalRefunds || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Adjustments</div>
                <div className="text-lg font-semibold text-gray-900">₹{Number(summary?.totalAdjustments || 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Net Due</div>
                <div className="text-lg font-semibold text-purple-700">₹{Number(summary?.netDue || 0).toLocaleString()}</div>
              </div>
            </div>
            {/* Quick add deposit/payment */}
            <div className="p-3 border rounded">
              <div className="text-sm font-medium text-gray-900 mb-2">Add Deposit / Payment</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <div className="md:col-span-2">
                  <span className="block text-xs text-gray-600 mb-1">Amount (₹)</span>
                  <Input type="number" min={0} value={amount} onChange={(e) => setAmount(parseFloat(e.target.value || '0'))} />
                </div>
                <div>
                  <span className="block text-xs text-gray-600 mb-1">Type</span>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="REFUND">Refund</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs text-gray-600 mb-1">Method</span>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>
                <div>
                  <Button className="w-full" onClick={addTxn}>Add</Button>
                </div>
              </div>
            </div>
            {/* Transactions table */}
            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-5 gap-2 bg-gray-50 p-2 text-xs text-gray-600">
                <div>Date/Time</div>
                <div>Type</div>
                <div>Description</div>
                <div>Reference</div>
                <div className="text-right">Amount (₹)</div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {transactions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No transactions</div>
                ) : (
                  transactions.map((t: any) => (
                    <div key={t.id} className="grid grid-cols-5 gap-2 p-2 text-sm">
                      <div>{new Date(t.processedAt).toLocaleString()}</div>
                      <div className="font-medium">{t.type}</div>
                      <div className="truncate" title={t.description || ''}>{t.description || '-'}</div>
                      <div className="truncate" title={t.reference || ''}>{t.reference || '-'}</div>
                      <div className="text-right">₹{Number(t.amount || 0).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={postBedCharge}>Post Today&apos;s Bed Charge</Button>
          <Button onClick={loadLedger}>Refresh</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

