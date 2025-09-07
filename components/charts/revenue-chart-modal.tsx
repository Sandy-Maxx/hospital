'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, TrendingUp, Calendar, CreditCard } from 'lucide-react'

interface RevenueChartModalProps {
  isOpen: boolean
  onClose: () => void
  bills: any[]
}

export default function RevenueChartModal({ isOpen, onClose, bills }: RevenueChartModalProps) {
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

  if (!isOpen) return null

  const getChartData = () => {
    const now = new Date()
    let data: { label: string; amount: number }[] = []

    const amountOf = (bill: any) => (typeof bill.finalAmount === 'number' ? bill.finalAmount : bill.totalAmount || 0)

    if (viewType === 'day') {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(startOfDay)
        hourStart.setHours(h)
        const hourEnd = new Date(startOfDay)
        hourEnd.setHours(h + 1)
        const hourLabel = `${h.toString().padStart(2, '0')}:00`
        const sum = bills
          .filter((b) => {
            const d = new Date(b.createdAt)
            return d >= hourStart && d < hourEnd
          })
          .reduce((s, b) => s + amountOf(b), 0)
        data.push({ label: hourLabel, amount: sum })
      }
    } else if (viewType === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        const sum = bills
          .filter((b) => {
            const d = new Date(b.createdAt)
            return d.toDateString() === date.toDateString()
          })
          .reduce((s, b) => s + amountOf(b), 0)
        data.push({ label: dayName, amount: sum })
      }
    } else if (viewType === 'month') {
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - (i + 1) * 7)
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() - i * 7)
        const label = `Week ${4 - i}`
        const sum = bills
          .filter((b) => {
            const d = new Date(b.createdAt)
            return d >= startDate && d < endDate
          })
          .reduce((s, b) => s + amountOf(b), 0)
        data.push({ label, amount: sum })
      }
    } else if (viewType === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1
      let year = now.getFullYear()
      for (let i = 3; i >= 0; i--) {
        let q = currentQuarter - i
        let qYear = year
        if (q <= 0) {
          q += 4
          qYear = year - 1
        }
        const startMonth = (q - 1) * 3
        const startDate = new Date(qYear, startMonth, 1)
        const endDate = new Date(qYear, startMonth + 3, 1)
        const label = `Q${q} ${qYear}`
        const sum = bills
          .filter((b) => {
            const d = new Date(b.createdAt)
            return d >= startDate && d < endDate
          })
          .reduce((s, b) => s + amountOf(b), 0)
        data.push({ label, amount: sum })
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        const sum = bills
          .filter((b) => {
            const d = new Date(b.createdAt)
            return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
          })
          .reduce((s, b) => s + amountOf(b), 0)
        data.push({ label: monthName, amount: sum })
      }
    }

    return data
  }

  const chartData = getChartData()
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1)
  const total = chartData.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-6 h-6 mr-2 text-green-600" />
              Revenue Analytics
            </h2>
            <p className="text-gray-600 mt-1">Visualize revenue trends</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex space-x-2 mb-6">
          <Button variant={viewType === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('day')}>Daily</Button>
          <Button variant={viewType === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('week')}>Weekly</Button>
          <Button variant={viewType === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('month')}>Monthly</Button>
          <Button variant={viewType === 'quarter' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('quarter')}>Quarterly</Button>
          <Button variant={viewType === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('year')}>Yearly</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              {viewType === 'day' && 'Hourly revenue today'}
              {viewType === 'week' && 'Daily revenue this week'}
              {viewType === 'month' && 'Weekly revenue this month'}
              {viewType === 'quarter' && 'Quarterly revenue (last 4 quarters)'}
              {viewType === 'year' && 'Monthly revenue this year'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">₹{item.amount.toFixed(0)}</div>
                    <div
                      className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                      style={{ height: `${Math.max((item.amount / maxAmount) * 200, 4)}px`, minHeight: '4px' }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Summary</h3>
          <p className="text-green-800 text-sm">
            Total revenue in selected period: <strong>₹{total.toLocaleString()}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
