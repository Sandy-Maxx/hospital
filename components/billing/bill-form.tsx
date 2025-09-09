"use client";

import React, { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Calculator, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

interface BillFormProps {
  prescription?: {
    id: string;
    patientId: string;
    doctorId: string;
    medicines: string;
    labTests: string;
    therapies: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
    doctor: {
      id: string;
      name: string;
      department: string;
    };
    consultation?: {
      appointment?: {
        id: string;
        type: string;
      };
    };
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface BillItem {
  itemType:
    | "CONSULTATION"
    | "MEDICINE"
    | "LAB_TEST"
    | "THERAPY"
    | "PROCEDURE"
    | "OTHER";
  itemName: string;
  quantity: number;
  unitPrice: number | null;
  gstRate: number | null;
}

function BillForm({
  prescription,
  onClose,
  onSuccess,
}: BillFormProps) {
  const [loading, setLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (prescription) {
      // Load consultation fee for the doctor
      fetchConsultationFee();
      // Parse prescription items
      parsePrescriptionItems();
    }
  }, [prescription]);

  const fetchConsultationFee = async () => {
    if (!prescription) return;

    try {
      const response = await fetch(
        `/api/doctors/consultation-fees?doctorId=${prescription.doctorId}`,
      );
      if (response.ok) {
        const data = await response.json();
        const generalFee = data.consultationFees.find(
          (fee: any) => fee.consultationType === "GENERAL",
        );
        if (generalFee) {
          setConsultationFee(Number(generalFee.fee));
        }
      }
    } catch (error) {
      console.error("Error fetching consultation fee:", error);
    }
  };

  const parsePrescriptionItems = () => {
    if (!prescription) return;

    const items: BillItem[] = [];

    // Some deployments store the entire prescription bundle (medicines, labTests, therapies)
    // inside the "medicines" string as JSON. Detect and support that.
    let bundle: any = null;
    try {
      if (typeof (prescription as any).medicines === "string") {
        const parsed = JSON.parse((prescription as any).medicines as string);
        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          (parsed.medicines || parsed.labTests || parsed.therapies)
        ) {
          bundle = parsed;
        }
      }
    } catch {}

    const resolveArray = (
      val: any,
      bundleKey: "medicines" | "labTests" | "therapies",
    ): any[] => {
      // If value is already an array
      if (Array.isArray(val)) return val;
      // If value is a JSON string of an array
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // Fallback: newline separated string -> map to objects with name
          return val
            .split("\n")
            .filter((l: string) => l.trim())
            .map((l: string) => ({ name: l.trim() }));
        }
      }
      // If combined bundle contains this key
      if (bundle && Array.isArray(bundle[bundleKey])) return bundle[bundleKey];
      return [];
    };

    // Medicines
    const meds = resolveArray((prescription as any).medicines, "medicines");
    const parseIntSafe = (s: any) => {
      if (typeof s === "number") return Math.floor(s);
      if (typeof s === "string") {
        const m = s.match(/\d+(?:\.\d+)?/);
        return m ? Math.floor(parseFloat(m[0])) : 0;
      }
      return 0;
    };
    const freqToPerDay = (s: any) => {
      const str = (s || "").toString().toLowerCase();
      if (str.includes("once")) return 1;
      if (str.includes("twice") || str.includes("two")) return 2;
      if (str.includes("thrice") || str.includes("three")) return 3;
      if (str.includes("four")) return 4;
      if (str.includes("every 6")) return 4;
      if (str.includes("every 8")) return 3;
      if (str.includes("every 12")) return 2;
      if (str.includes("every")) return 1;
      return 1;
    };
    const durationToDays = (s: any) => {
      const str = (s || "").toString().toLowerCase();
      const num = parseIntSafe(str) || 1;
      if (str.includes("day")) return num;
      if (str.includes("week")) return num * 7;
      if (str.includes("month")) return num * 30;
      return num;
    };

    meds.forEach((medicine: any) => {
      const name = medicine?.name || medicine?.itemName || "Medicine";
      const dosageText = medicine?.dosage || "";
      const dosageCount = parseIntSafe(dosageText) || 1;
      const frequencyPerDay = freqToPerDay(medicine?.frequency);
      const days = durationToDays(medicine?.duration);
      const qty = Math.max(1, dosageCount * frequencyPerDay * days);
      const dosage = dosageText ? ` - ${dosageText}` : "";
      items.push({
        itemType: "MEDICINE",
        itemName: `${name}${dosage}`,
        quantity: qty,
        unitPrice: null,
        gstRate: 12,
      });
    });

    // Lab Tests
    const labs = resolveArray((prescription as any).labTests, "labTests");
    labs.forEach((test: any) => {
      const name = test?.name || test?.itemName || String(test);
      items.push({
        itemType: "LAB_TEST",
        itemName: name,
        quantity: 1,
        unitPrice: null,
        gstRate: 5,
      });
    });

    // Therapies
    const thers = resolveArray((prescription as any).therapies, "therapies");
    thers.forEach((therapy: any) => {
      const name = therapy?.name || therapy?.itemName || String(therapy);
      const qty = parseInt(therapy?.sessions) || 1;
      items.push({
        itemType: "THERAPY",
        itemName: name,
        quantity: qty,
        unitPrice: null,
        gstRate: 18,
      });
    });

    setBillItems(items);
  };

  // Keep consultation item synced with the current consultationFee
  useEffect(() => {
    if (!prescription) return;
    setBillItems((prev) => {
      const consultIndex = prev.findIndex((i) => i.itemType === "CONSULTATION");
      const consultItem: BillItem = {
        itemType: "CONSULTATION",
        itemName: `Consultation - ${prescription.doctor.name}`,
        quantity: 1,
        unitPrice: consultationFee || 0,
        gstRate: 18,
      };
      if (consultIndex >= 0) {
        const next = [...prev];
        next[consultIndex] = consultItem;
        return next;
      }
      return [consultItem, ...prev];
    });
  }, [consultationFee, prescription]);

  const addBillItem = () => {
    setBillItems([
      ...billItems,
      {
        itemType: "OTHER",
        itemName: "",
        quantity: 1,
        unitPrice: null,
        gstRate: 18,
      },
    ]);
  };

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setBillItems(updatedItems);
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let totalAmount = consultationFee;
    let totalCGST = 0;
    let totalSGST = 0;

    billItems.forEach((item) => {
      if (item.unitPrice) {
        const itemTotal = item.unitPrice * item.quantity;
        totalAmount += itemTotal;

        if (item.gstRate) {
          const gstAmount = (itemTotal * item.gstRate) / 100;
          totalCGST += gstAmount / 2;
          totalSGST += gstAmount / 2;
        }
      }
    });

    const finalAmount = totalAmount + totalCGST + totalSGST - discountAmount;

    return {
      totalAmount,
      totalCGST,
      totalSGST,
      finalAmount,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescription) return;

    setLoading(true);
    try {
      const billData = {
        patientId: prescription.patientId,
        prescriptionId: prescription.id,
        appointmentId: prescription.consultation?.appointment?.id,
        doctorId: prescription.doctorId,
        consultationFee,
        // Only include items where the user has entered a rate
        items: billItems.filter(
          (item) =>
            item.itemName.trim() !== "" &&
            item.unitPrice !== null &&
            item.unitPrice > 0,
        ),
        discountAmount,
        paymentMethod,
        notes,
      };

      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      if (response.ok) {
        toast.success("Bill created successfully");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create bill");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Bill</h2>
            {prescription && (
              <p className="text-gray-600">
                Patient: {prescription.patient.firstName}{" "}
                {prescription.patient.lastName} | Doctor:{" "}
                {prescription.doctor.name}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Consultation Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consultation Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="INSURANCE">Insurance</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Bill Items</CardTitle>
                <Button type="button" onClick={addBillItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              <CardDescription>
                All prescription items are listed. Enter Unit Price only for
                items to be billed. Items without a price will NOT be added to
                the bill.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left border">Type</th>
                      <th className="px-3 py-2 text-left border">Item</th>
                      <th className="px-3 py-2 text-center border">Qty</th>
                      <th className="px-3 py-2 text-right border">
                        Unit Price (₹)
                      </th>
                      <th className="px-3 py-2 text-right border">GST %</th>
                      <th className="px-3 py-2 text-right border">
                        Line Total (₹)
                      </th>
                      <th className="px-3 py-2 text-center border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => {
                      const lineTotal = item.unitPrice
                        ? item.unitPrice * item.quantity
                        : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border">
                            <select
                              value={item.itemType}
                              onChange={(e) =>
                                updateBillItem(
                                  index,
                                  "itemType",
                                  e.target.value,
                                )
                              }
                              className="w-full p-1 border border-gray-300 rounded"
                            >
                              <option value="CONSULTATION">Consultation</option>
                              <option value="MEDICINE">Medicine</option>
                              <option value="LAB_TEST">Lab Test</option>
                              <option value="THERAPY">Therapy</option>
                              <option value="PROCEDURE">Procedure</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 border">
                            <Input
                              value={item.itemName}
                              onChange={(e) =>
                                updateBillItem(
                                  index,
                                  "itemName",
                                  e.target.value,
                                )
                              }
                              className="text-sm"
                              placeholder="Enter item name"
                            />
                          </td>
                          <td className="px-3 py-2 border text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateBillItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                              className="text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-2 border text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice ?? ""}
                              onChange={(e) =>
                                updateBillItem(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              className="text-sm text-right"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2 border text-right">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.gstRate ?? ""}
                              onChange={(e) =>
                                updateBillItem(
                                  index,
                                  "gstRate",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                              className="text-sm text-right"
                              placeholder="18"
                            />
                          </td>
                          <td className="px-3 py-2 border text-right">
                            {lineTotal > 0 ? lineTotal.toFixed(2) : "-"}
                          </td>
                          <td className="px-3 py-2 border text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBillItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{totals.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{totals.totalCGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{totals.totalSGST.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Final Amount:</span>
                    <span>₹{totals.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating Bill..." : "Create Bill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(BillForm);
