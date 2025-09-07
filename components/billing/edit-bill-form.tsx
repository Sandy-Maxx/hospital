'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Calculator, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface EditBillFormProps {
  isOpen: boolean
  bill: any | null
  onClose: () => void
  onSuccess: () => void
}

interface BillItem {
  itemType: 'CONSULTATION' | 'MEDICINE' | 'LAB_TEST' | 'THERAPY' | 'PROCEDURE' | 'OTHER'
  itemName: string
  quantity: number
  unitPrice: number | null
  gstRate: number | null
}

export default function EditBillForm({ isOpen, bill, onClose, onSuccess }: EditBillFormProps) {
  const [loading, setLoading] = useState(false)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    if (!isOpen || !bill) return
    // Prefill items from bill
    const items: BillItem[] = (bill.billItems || []).map((it: any) => ({
      itemType: it.itemType,
      itemName: it.itemName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      gstRate: it.gstRate ?? 0,
    }))
    setBillItems(items)
    setDiscountAmount(bill.discountAmount || 0)
    setPaymentMethod(bill.paymentMethod || 'CASH')
    setNotes(bill.notes || '')
  }, [isOpen, bill])

  const addBillItem = () => {
    setBillItems([...billItems, { itemType: 'OTHER', itemName: '', quantity: 1, unitPrice: null, gstRate: 18 }])
  }
  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updated = [...billItems]
    updated[index] = { ...updated[index], [field]: value }
    setBillItems(updated)
  }
  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    let totalAmount = 0
    let totalCGST = 0
    let totalSGST = 0
    billItems.forEach((item) => {
      if (item.unitPrice) {
        const line = item.unitPrice * item.quantity
        totalAmount += line
        if (item.gstRate) {
          const gst = (line * item.gstRate) / 100
          totalCGST += gst / 2
          totalSGST += gst / 2
        }
      }
    })
    const finalAmount = totalAmount + totalCGST + totalSGST - discountAmount
    return { totalAmount, totalCGST, totalSGST, finalAmount }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bill) return
    setLoading(true)
    try {
      const payload = {
        items: billItems.filter((i) => i.itemName.trim() !== '' && i.unitPrice !== null && i.unitPrice > 0),
        discountAmount,
        paymentMethod,
        notes,
      }
      const res = await fetch(`/api/bills?id=${bill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success('Bill updated')
        onSuccess()
      } else {
        toast.error('Failed to update bill')
      }
    } catch (e) {
      toast.error('Error updating bill')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  if (!isOpen || !bill) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Edit Bill #{bill.billNumber || bill.id}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Bill Items</CardTitle>
                <Button type="button" size="sm" onClick={addBillItem}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>
              <CardDescription>Edit bill items, rates, and taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left border">Type</th>
                      <th className="px-3 py-2 text-left border">Item</th>
                      <th className="px-3 py-2 text-center border">Qty</th>
                      <th className="px-3 py-2 text-right border">Unit Price (₹)</th>
                      <th className="px-3 py-2 text-right border">GST %</th>
                      <th className="px-3 py-2 text-center border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border">
                          <select
                            value={item.itemType}
                            onChange={(e) => updateBillItem(idx, 'itemType', e.target.value)}
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
                          <Input value={item.itemName} onChange={(e) => updateBillItem(idx, 'itemName', e.target.value)} />
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <Input type="number" min="1" value={item.quantity} onChange={(e) => updateBillItem(idx, 'quantity', Number(e.target.value))} />
                        </td>
                        <td className="px-3 py-2 border text-right">
                          <Input type="number" min="0" step="0.01" value={item.unitPrice ?? ''} onChange={(e) => updateBillItem(idx, 'unitPrice', e.target.value ? Number(e.target.value) : null)} />
                        </td>
                        <td className="px-3 py-2 border text-right">
                          <Input type="number" min="0" max="100" step="0.01" value={item.gstRate ?? ''} onChange={(e) => updateBillItem(idx, 'gstRate', e.target.value ? Number(e.target.value) : null)} />
                        </td>
                        <td className="px-3 py-2 border text-center">
                          <Button type="button" variant="outline" size="sm" onClick={() => removeBillItem(idx)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
                  <Input id="discountAmount" type="number" min="0" step="0.01" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="INSURANCE">Insurance</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Final Amount:</span>
                    <span>₹{totals.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
