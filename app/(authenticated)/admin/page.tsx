'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings, FileText, Activity, TrendingUp, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session } = useSession()

  const stats = [
    {
      title: 'Total Staff',
      value: '45',
      change: '+3 this month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Patients',
      value: '1,234',
      change: '+12% from last month',
      icon: UserPlus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Monthly Revenue',
      value: '$125,000',
      change: '+8% from last month',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'All systems operational',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  const quickActions = [
    {
      title: 'Hospital Settings',
      description: 'Configure hospital information and branding',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Staff Management',
      description: 'Manage staff members and permissions',
      icon: Users,
      href: '/staff',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Reports & Analytics',
      description: 'View detailed reports and analytics',
      icon: FileText,
      href: '/reports',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Patient Management',
      description: 'Manage patient records and information',
      icon: UserPlus,
      href: '/patients',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ]

  if (session?.user?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">Access denied. Admin privileges required.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-lg text-white mb-4 ${action.color}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New staff member added</p>
                <p className="text-xs text-gray-500">Dr. Sarah Johnson joined Cardiology department</p>
              </div>
              <span className="text-xs text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">Daily backup process finished successfully</p>
              </div>
              <span className="text-xs text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Hospital settings updated</p>
                <p className="text-xs text-gray-500">Branding and contact information modified</p>
              </div>
              <span className="text-xs text-gray-400">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
