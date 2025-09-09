"use client";

import React, { useEffect, useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, X } from "lucide-react";
import { formatBillNumber } from "@/lib/identifiers";

interface BillPrintProps {
  isOpen: boolean;
  onClose: () => void;
  bill: any | null;
}

interface HospitalSettings {
  name?: string;
  tagline?: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  primaryColor?: string;
}

function BillPrint({ isOpen, onClose, bill }: BillPrintProps) {
  const [settings, setSettings] = useState<HospitalSettings>({});
  const [fullBill, setFullBill] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSettings(data))
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    // Lazy-load full bill details (including items) if not present
    if (!isOpen || !bill?.id) return;
    const hasItems = Array.isArray((bill as any).billItems) && (bill as any).billItems.length > 0;
    if (hasItems) {
      setFullBill(bill);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/bills?id=${bill.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullBill(data.bill || bill);
        } else {
          setFullBill(bill);
        }
      } catch {
        setFullBill(bill);
      }
    })();
  }, [isOpen, bill]);

  if (!isOpen || !bill) return null;

  const b = fullBill || bill;
  const subtotal = b.totalAmount || 0;
  const cgst = b.cgst || 0;
  const sgst = b.sgst || 0;
  const discount = b.discountAmount || 0;
  const final = b.finalAmount ?? subtotal + cgst + sgst - discount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            {settings.logo && (
              <img
                src={settings.logo}
                alt="logo"
                className="h-10 w-10 object-contain"
              />
            )}
            <div>
              <div className="text-xl font-bold">
                {settings.name || "Clinic"}
              </div>
              {settings.tagline && (
                <div className="text-sm text-gray-600">{settings.tagline}</div>
              )}
              {(settings.address || settings.phone || settings.email) && (
                <div className="text-xs text-gray-500">
                  {settings.address}
                  {settings.address && (settings.phone || settings.email)
                    ? " • "
                    : ""}
                  {settings.phone}
                  {settings.phone && settings.email ? " • " : ""}
                  {settings.email}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <div className="text-gray-500">Bill No.</div>
              <div className="font-semibold">
                {formatBillNumber({
                  billNumber: b.billNumber,
                  id: b.id,
                  createdAt: b.createdAt,
                })}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Date</div>
              <div className="font-semibold">
                {new Date(b.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Patient</div>
              <div className="font-semibold">
                {b.patient?.firstName} {b.patient?.lastName}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Doctor</div>
              <div className="font-semibold">{b.doctor?.name || "-"}</div>
            </div>
          </div>

          {/* Items */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 border-b">Type</th>
                    <th className="text-left px-4 py-2 border-b">Item</th>
                    <th className="text-right px-4 py-2 border-b">Qty</th>
                    <th className="text-right px-4 py-2 border-b">Rate (₹)</th>
                    <th className="text-right px-4 py-2 border-b">
                      Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(b.billItems || []).map((it: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-4 py-2">{it.itemType}</td>
                      <td className="px-4 py-2">{it.itemName}</td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        {(it.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {(it.totalPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Totals */}
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <div>Subtotal</div>
              <div>₹{subtotal.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div>CGST</div>
              <div>₹{cgst.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div>SGST</div>
              <div>₹{sgst.toFixed(2)}</div>
            </div>
            <div className="flex justify-between">
              <div>Discount</div>
              <div>-₹{discount.toFixed(2)}</div>
            </div>
            <div className="flex justify-between font-semibold border-t pt-2 mt-2 text-base">
              <div>Total</div>
              <div>₹{final.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            This is a computer-generated invoice. Prices include applicable
            taxes. Please retain for your records.
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BillPrint);
