"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Users } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  appointments: any[]
}

// Distinct patients per time bucket
export default function PatientsDistinctChartModal({ isOpen, onClose, appointments }: Props) {
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week')
  if (!isOpen) return null

  const getChartData = () => {
    const now = new Date()
    const buckets: { label: string; ids: Set<string> }[] = []

    const pushBucket = (label: string, filter: (d: Date) => boolean) => {
      const ids = new Set<string>()
      for (const apt of appointments) {
        const d = new Date(apt.createdAt || apt.dateTime)
        if (filter(d)) {
          const pid = apt.patient?.id
          if (pid) ids.add(pid)
        }
      }
      buckets.push({ label, ids })
    }

    if (viewType === 'day') {
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(startOfDay)
        hourStart.setHours(h)
        const hourEnd = new Date(startOfDay)
        hourEnd.setHours(h + 1)
        pushBucket(`${h.toString().padStart(2, '0')}:00`, (d) => d >= hourStart && d < hourEnd)
      }
    } else if (viewType === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        pushBucket(dayName, (d) => d.toDateString() === date.toDateString())
      }
    } else if (viewType === 'month') {
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - (i + 1) * 7)
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() - i * 7)
        pushBucket(`Week ${4 - i}`, (d) => d >= startDate && d < endDate)
      }
    } else if (viewType === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1
      let year = now.getFullYear()
      for (let i = 3; i >= 0; i--) {
        let q = currentQuarter - i
        let qYear = year
        if (q <= 0) { q += 4; qYear = year - 1 }
        const startMonth = (q - 1) * 3
        const startDate = new Date(qYear, startMonth, 1)
        const endDate = new Date(qYear, startMonth + 3, 1)
        pushBucket(`Q${q} ${qYear}`, (d) => d >= startDate && d < endDate)
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        pushBucket(monthName, (d) => d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear())
      }
    }

    return buckets.map((b) => ({ label: b.label, count: b.ids.size }))
  }

  const chartData = getChartData()
  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const totalDistinct = chartData.reduce((s, d) => s + d.count, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-green-600" />
              Distinct Patients Analytics
            </h2>
            <p className="text-gray-600 mt-1">Counts unique patients per period</p>
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
            <CardTitle>Distinct Patients Trends</CardTitle>
            <CardDescription>Unique patients per selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div className="w-full flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{item.count}</div>
                    <div
                      className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                      style={{ height: `${Math.max((item.count / maxCount) * 200, 4)}px`, minHeight: '4px' }}
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
          <p className="text-green-800 text-sm">Total distinct patients across displayed buckets: <strong>{totalDistinct}</strong></p>
        </div>
      </div>
    </div>
  )
}

