'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard, Plus, Receipt, Search, FileText, Download, Printer, QrCode, Eye, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import BillForm from '@/components/billing/bill-form'
import BillPrint from '@/components/billing/bill-print'
import EditBillForm from '@/components/billing/edit-bill-form'
import toast from 'react-hot-toast'

interface Bill {
  id: string
  billNumber: string
  totalAmount: number
  cgst?: number
  sgst?: number
  discountAmount?: number
  finalAmount?: number
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  patient: {
    firstName: string
    lastName: string
    phone: string
  }
  doctor?: {
    name: string
    department?: string
  }
  billItems?: Array<{
    itemType: string
    itemName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    gstRate?: number
  }>
}

const paymentStatusColors = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  REFUNDED: 'bg-red-100 text-red-800',
}

export default function Billing() {
  const [bills, setBills] = useState<Bill[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateBill, setShowCreateBill] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'bills' | 'prescriptions'>('prescriptions')
  const [viewBill, setViewBill] = useState<Bill | null>(null)
  const [showBillModal, setShowBillModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [billsCount, setBillsCount] = useState<number>(0)

  const fetchBills = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date: selectedDate,
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/bills?${params}`)
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills)
        if (data.pagination?.total !== undefined) setBillsCount(data.pagination.total)
      } else {
        toast.error('Failed to fetch bills')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fetchBillsCount = async () => {
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        ...(statusFilter && { status: statusFilter }),
        page: '1',
        limit: '1'
      })
      const response = await fetch(`/api/bills?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.pagination?.total !== undefined) setBillsCount(data.pagination.total)
      }
    } catch {}
  }

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        date: selectedDate,
      })

      const response = await fetch(`/api/prescriptions/pending-billing?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPrescriptions(data.prescriptions || [])
      } else {
        toast.error('Failed to fetch prescriptions')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'bills') {
      fetchBills()
    } else {
      fetchPrescriptions()
      // keep bills count updated even when not on the bills tab
      fetchBillsCount()
    }
  }, [selectedDate, statusFilter, activeTab])

  // Initial prefetch counts
  useEffect(() => {
    fetchBillsCount()
  }, [])

  const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
  const paidBills = bills.filter(bill => bill.paymentStatus === 'PAID')
  const pendingBills = bills.filter(bill => bill.paymentStatus === 'PENDING')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-primary-600" />
            Billing & Payments
          </h1>
          <p className="text-gray-600 mt-2">Manage patient bills and payment records</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'prescriptions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('prescriptions')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Pending Prescriptions ({prescriptions.length})
          </Button>
          <Button 
            variant={activeTab === 'bills' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bills')}
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
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{bills.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{paidBills.length}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{pendingBills.length}</p>
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
      {activeTab === 'prescriptions' ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Prescriptions for Billing
            </CardTitle>
            <CardDescription>
              {prescriptions.length} prescriptions awaiting billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending prescriptions for billing</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
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
                              {prescription.patient.firstName} {prescription.patient.lastName}
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
                        <Button
                          onClick={() => setSelectedPrescription(prescription)}
                          className="mb-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Bill
                        </Button>
                        <div className="text-sm text-gray-500">
                          {prescription.doctor.department}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Medicines:</span>
                          <span className="ml-2 font-medium">
                            {prescription.medicines ? JSON.parse(prescription.medicines || '[]').length || prescription.medicines.split('\n').filter(Boolean).length : 0} items
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Lab Tests:</span>
                          <span className="ml-2 font-medium">
                            {prescription.labTests ? JSON.parse(prescription.labTests || '[]').length || prescription.labTests.split('\n').filter(Boolean).length : 0} tests
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Therapies:</span>
                          <span className="ml-2 font-medium">
                            {prescription.therapies ? JSON.parse(prescription.therapies || '[]').length || prescription.therapies.split('\n').filter(Boolean).length : 0} sessions
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Bills for {formatDate(selectedDate)}
            </CardTitle>
            <CardDescription>
              {bills.length} bills found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
                              <span>Bill #{bill.id.slice(-8)}</span>
                              <span>{bill.patient.phone}</span>
                              <span>{formatDate(bill.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{(bill.finalAmount ?? bill.totalAmount ?? 0).toLocaleString()}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            paymentStatusColors[bill.paymentStatus as keyof typeof paymentStatusColors]
                          }`}>
                            {bill.paymentStatus}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {bill.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>

                                  <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="ml-2 font-medium">₹{(bill.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Discount:</span>
                    <span className="ml-2 font-medium">₹{(bill.discountAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tax (CGST+SGST):</span>
                    <span className="ml-2 font-medium">₹{(((bill.cgst || 0) + (bill.sgst || 0)) || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => { setViewBill(bill as any); setShowBillModal(true) }}
                >
                  <Eye className="inline w-4 h-4 mr-1" /> View/Print
                </button>
                <button
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  onClick={() => { setViewBill(bill as any); setShowEditModal(true) }}
                >
                  <Pencil className="inline w-4 h-4 mr-1" /> Edit
                </button>
                <button
                  className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  onClick={async () => {
                    const ok = typeof window !== 'undefined' ? window.confirm('Delete this bill? This cannot be undone.') : true
                    if (!ok) return
                    try {
                      const res = await fetch(`/api/bills?id=${bill.id}`, { method: 'DELETE' })
                      if (res.ok) {
                        toast.success('Bill deleted')
                        fetchBills()
                      } else {
                        toast.error('Failed to delete bill')
                      }
                    } catch {
                      toast.error('Failed to delete bill')
                    }
                  }}
                >
                  <Trash2 className="inline w-4 h-4 mr-1" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
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
            fetchPrescriptions()
            fetchBills()
          }}
        />
      )}
      {/* Bill Print Modal */}
      <BillPrint isOpen={showBillModal} onClose={() => setShowBillModal(false)} bill={viewBill} />
      {/* Edit Bill Modal */}
      <EditBillForm
        isOpen={showEditModal}
        bill={viewBill as any}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => { setShowEditModal(false); fetchBills(); }}
      />
    </div>
  )
}
