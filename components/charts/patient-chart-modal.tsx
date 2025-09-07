'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, TrendingUp, Calendar, Users } from 'lucide-react'

interface PatientChartModalProps {
  isOpen: boolean
  onClose: () => void
  weeklyCount: number
  appointments: any[]
}

export default function PatientChartModal({ isOpen, onClose, weeklyCount, appointments }: PatientChartModalProps) {
  const [viewType, setViewType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week')

  if (!isOpen) return null

  const getChartData = () => {
    const now = new Date()
    let data: { label: string; count: number }[] = []

    if (viewType === 'day') {
      // Today by hour (0-23)
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(startOfDay)
        hourStart.setHours(h)
        const hourEnd = new Date(startOfDay)
        hourEnd.setHours(h + 1)
        const hourLabel = `${h.toString().padStart(2, '0')}:00`
        const hourCount = appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt)
          return aptDate >= hourStart && aptDate < hourEnd && apt.status === 'COMPLETED'
        }).length
        data.push({ label: hourLabel, count: hourCount })
      }
    } else if (viewType === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dayCount = appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt)
          return aptDate.toDateString() === date.toDateString() && apt.status === 'COMPLETED'
        }).length
        data.push({ label: dayName, count: dayCount })
      }
    } else if (viewType === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - (i + 1) * 7)
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() - i * 7)
        
        const weekCount = appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt)
          return aptDate >= startDate && aptDate < endDate && apt.status === 'COMPLETED'
        }).length
        
        data.push({ 
          label: `Week ${4 - i}`, 
          count: weekCount 
        })
      }
    } else if (viewType === 'quarter') {
      // Last 4 quarters
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
        const qCount = appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt)
          return aptDate >= startDate && aptDate < endDate && apt.status === 'COMPLETED'
        }).length
        data.push({ label, count: qCount })
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now)
        date.setMonth(date.getMonth() - i)
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        const monthCount = appointments.filter(apt => {
          const aptDate = new Date(apt.createdAt)
          return aptDate.getMonth() === date.getMonth() && 
                 aptDate.getFullYear() === date.getFullYear() && 
                 apt.status === 'COMPLETED'
        }).length
        data.push({ label: monthName, count: monthCount })
      }
    }

    return data
  }

  const chartData = getChartData()
  const maxCount = Math.max(...chartData.map(d => d.count), 1)
  const totalPatients = chartData.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Patient Analytics
            </h2>
            <p className="text-gray-600 mt-1">Track your patient consultation trends</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* View Type Selector */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={viewType === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('day')}
          >
            Daily
          </Button>
          <Button
            variant={viewType === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('week')}
          >
            Weekly
          </Button>
          <Button
            variant={viewType === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('month')}
          >
            Monthly
          </Button>
          <Button
            variant={viewType === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('quarter')}
          >
            Quarterly
          </Button>
          <Button
            variant={viewType === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewType('year')}
          >
            Yearly
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    {viewType === 'week' ? 'This Week' : viewType === 'month' ? 'This Month' : 'This Year'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Peak Day</p>
                  <p className="text-2xl font-bold text-gray-900">{maxCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(totalPatients / chartData.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Consultation Trends</CardTitle>
            <CardDescription>
              {viewType === 'week' && 'Daily consultations over the past week'}
              {viewType === 'month' && 'Weekly consultations over the past month'}
              {viewType === 'year' && 'Monthly consultations over the past year'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{item.count}</div>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{
                        height: `${Math.max((item.count / maxCount) * 200, 4)}px`,
                        minHeight: '4px'
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
          <p className="text-blue-800 text-sm">
            You have completed <strong>{totalPatients}</strong> consultations in the selected period.
            {totalPatients > 0 && (
              <>
                {' '}Your most productive {viewType === 'week' ? 'day' : viewType === 'month' ? 'week' : 'month'} had{' '}
                <strong>{maxCount}</strong> consultations.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
