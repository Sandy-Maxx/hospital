'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Calculator, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface BillFormProps {
  prescription?: {
    id: string
    patientId: string
    doctorId: string
    medicines: string
    labTests: string
    therapies: string
    patient: {
      id: string
      firstName: string
      lastName: string
      phone: string
    }
    doctor: {
      id: string
      name: string
      department: string
    }
    consultation?: {
      appointment?: {
        id: string
        type: string
      }
    }
  }
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

export default function BillForm({ prescription, onClose, onSuccess }: BillFormProps) {
  const [loading, setLoading] = useState(false)
  const [consultationFee, setConsultationFee] = useState<number>(0)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    if (prescription) {
      // Load consultation fee for the doctor
      fetchConsultationFee()
      // Parse prescription items
      parsePrescriptionItems()
    }
  }, [prescription])

  const fetchConsultationFee = async () => {
    if (!prescription) return
    
    try {
      const response = await fetch(`/api/doctors/consultation-fees?doctorId=${prescription.doctorId}`)
      if (response.ok) {
        const data = await response.json()
        const generalFee = data.consultationFees.find((fee: any) => fee.consultationType === 'GENERAL')
        if (generalFee) {
          setConsultationFee(Number(generalFee.fee))
        }
      }
    } catch (error) {
      console.error('Error fetching consultation fee:', error)
    }
  }

  const parsePrescriptionItems = () => {
    if (!prescription) return

    const items: BillItem[] = []

    // Add consultation fee
    if (consultationFee > 0) {
      items.push({
        itemType: 'CONSULTATION',
        itemName: `Consultation - ${prescription.doctor.name}`,
        quantity: 1,
        unitPrice: consultationFee,
        gstRate: 18
      })
    }

    // Parse medicines
    try {
      const medicines = JSON.parse(prescription.medicines || '[]')
      medicines.forEach((medicine: any) => {
        items.push({
          itemType: 'MEDICINE',
          itemName: `${medicine.name} - ${medicine.dosage}`,
          quantity: parseInt(medicine.quantity) || 1,
          unitPrice: null,
          gstRate: 12
        })
      })
    } catch (e) {
      // Handle string format
      if (prescription.medicines) {
        const medicineLines = prescription.medicines.split('\n').filter(line => line.trim())
        medicineLines.forEach(line => {
          items.push({
            itemType: 'MEDICINE',
            itemName: line.trim(),
            quantity: 1,
            unitPrice: null,
            gstRate: 12
          })
        })
      }
    }

    // Parse lab tests
    try {
      const labTests = JSON.parse(prescription.labTests || '[]')
      labTests.forEach((test: any) => {
        items.push({
          itemType: 'LAB_TEST',
          itemName: test.name || test,
          quantity: 1,
          unitPrice: null,
          gstRate: 5
        })
      })
    } catch (e) {
      if (prescription.labTests) {
        const testLines = prescription.labTests.split('\n').filter(line => line.trim())
        testLines.forEach(line => {
          items.push({
            itemType: 'LAB_TEST',
            itemName: line.trim(),
            quantity: 1,
            unitPrice: null,
            gstRate: 5
          })
        })
      }
    }

    // Parse therapies
    try {
      const therapies = JSON.parse(prescription.therapies || '[]')
      therapies.forEach((therapy: any) => {
        items.push({
          itemType: 'THERAPY',
          itemName: therapy.name || therapy,
          quantity: parseInt(therapy.sessions) || 1,
          unitPrice: null,
          gstRate: 18
        })
      })
    } catch (e) {
      if (prescription.therapies) {
        const therapyLines = prescription.therapies.split('\n').filter(line => line.trim())
        therapyLines.forEach(line => {
          items.push({
            itemType: 'THERAPY',
            itemName: line.trim(),
            quantity: 1,
            unitPrice: null,
            gstRate: 18
          })
        })
      }
    }

    setBillItems(items)
  }

  const addBillItem = () => {
    setBillItems([...billItems, {
      itemType: 'OTHER',
      itemName: '',
      quantity: 1,
      unitPrice: null,
      gstRate: 18
    }])
  }

  const updateBillItem = (index: number, field: keyof BillItem, value: any) => {
    const updatedItems = [...billItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setBillItems(updatedItems)
  }

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    let totalAmount = consultationFee
    let totalCGST = 0
    let totalSGST = 0

    billItems.forEach(item => {
      if (item.unitPrice) {
        const itemTotal = item.unitPrice * item.quantity
        totalAmount += itemTotal
        
        if (item.gstRate) {
          const gstAmount = (itemTotal * item.gstRate) / 100
          totalCGST += gstAmount / 2
          totalSGST += gstAmount / 2
        }
      }
    })

    const finalAmount = totalAmount + totalCGST + totalSGST - discountAmount

    return {
      totalAmount,
      totalCGST,
      totalSGST,
      finalAmount
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prescription) return

    setLoading(true)
    try {
      const billData = {
        patientId: prescription.patientId,
        prescriptionId: prescription.id,
        appointmentId: prescription.consultation?.appointment?.id,
        doctorId: prescription.doctorId,
        consultationFee,
        items: billItems.filter(item => item.itemName.trim() !== ''),
        discountAmount,
        paymentMethod,
        notes
      }

      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      })

      if (response.ok) {
        toast.success('Bill created successfully')
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create bill')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Bill</h2>
            {prescription && (
              <p className="text-gray-600">
                Patient: {prescription.patient.firstName} {prescription.patient.lastName} | 
                Doctor: {prescription.doctor.name}
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
                Items with blank prices will be omitted from the final bill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-2">
                      <Label className="text-xs">Type</Label>
                      <select
                        value={item.itemType}
                        onChange={(e) => updateBillItem(index, 'itemType', e.target.value)}
                        className="w-full p-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="CONSULTATION">Consultation</option>
                        <option value="MEDICINE">Medicine</option>
                        <option value="LAB_TEST">Lab Test</option>
                        <option value="THERAPY">Therapy</option>
                        <option value="PROCEDURE">Procedure</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Item Name</Label>
                      <Input
                        value={item.itemName}
                        onChange={(e) => updateBillItem(index, 'itemName', e.target.value)}
                        className="text-sm"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateBillItem(index, 'quantity', Number(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price (₹)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateBillItem(index, 'unitPrice', e.target.value ? Number(e.target.value) : null)}
                        className="text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">GST Rate (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.gstRate || ''}
                        onChange={(e) => updateBillItem(index, 'gstRate', e.target.value ? Number(e.target.value) : null)}
                        className="text-sm"
                        placeholder="18"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBillItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
              {loading ? 'Creating Bill...' : 'Create Bill'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
