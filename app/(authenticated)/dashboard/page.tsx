'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Clock, CreditCard, Activity, TrendingUp } from 'lucide-react'

const stats = [
  {
    title: 'Total Patients',
    value: '1,234',
    change: '+12%',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Today\'s Appointments',
    value: '45',
    change: '+5%',
    icon: Calendar,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Waiting Queue',
    value: '8',
    change: '-2',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    title: 'Today\'s Revenue',
    value: '₹25,400',
    change: '+18%',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
]

const recentActivities = [
  {
    id: 1,
    type: 'appointment',
    message: 'New appointment booked for John Doe',
    time: '2 minutes ago',
  },
  {
    id: 2,
    type: 'consultation',
    message: 'Dr. Smith completed consultation with Jane Smith',
    time: '15 minutes ago',
  },
  {
    id: 3,
    type: 'payment',
    message: 'Payment received from Michael Johnson - ₹1,500',
    time: '30 minutes ago',
  },
  {
    id: 4,
    type: 'registration',
    message: 'New patient registered - Sarah Wilson',
    time: '1 hour ago',
  },
]

export default function Dashboard() {
  const { data: session } = useSession()

  const getDashboardTitle = () => {
    const role = session?.user?.role
    switch (role) {
      case 'ADMIN':
        return 'Admin Dashboard'
      case 'DOCTOR':
        return 'Doctor Dashboard'
      case 'RECEPTIONIST':
        return 'Receptionist Dashboard'
      default:
        return 'Dashboard'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getDashboardTitle()}</h1>
        <p className="text-gray-600">
          Welcome back, {session?.user?.name}! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stat.change} from last week
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest updates from the hospital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {session?.user?.role === 'RECEPTIONIST' && (
                <>
                  <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Users className="w-6 h-6 text-primary-600 mb-2" />
                    <p className="font-medium">Register Patient</p>
                    <p className="text-sm text-gray-500">Add new patient</p>
                  </button>
                  <Link href="/book-appointment">
                    <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full">
                      <Calendar className="w-6 h-6 text-green-600 mb-2" />
                      <p className="font-medium">Book Appointment</p>
                      <p className="text-sm text-gray-500">Schedule visit</p>
                    </button>
                  </Link>
                </>
              )}
              {session?.user?.role === 'DOCTOR' && (
                <>
                  <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Clock className="w-6 h-6 text-yellow-600 mb-2" />
                    <p className="font-medium">View Queue</p>
                    <p className="text-sm text-gray-500">Patient waiting list</p>
                  </button>
                  <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Activity className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="font-medium">Start Consultation</p>
                    <p className="text-sm text-gray-500">Begin patient care</p>
                  </button>
                </>
              )}
              {session?.user?.role === 'ADMIN' && (
                <>
                  <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="font-medium">Manage Staff</p>
                    <p className="text-sm text-gray-500">Add/edit users</p>
                  </button>
                  <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-500">Analytics & insights</p>
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
