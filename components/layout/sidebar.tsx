'use client'

import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  Calendar,
  UserPlus,
  ClipboardList,
  Stethoscope,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Activity,
  Pill,
  Shield,
  Clock
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const menuItems = {
  ADMIN: [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Shield, label: 'Admin Panel', href: '/admin' },
    { icon: Users, label: 'User Management', href: '/admin/users' },
    { icon: Clock, label: 'Doctor Availability', href: '/admin/doctor-availability' },
    { icon: Settings, label: 'Hospital Settings', href: '/admin/settings' },
    { icon: Users, label: 'Staff Management', href: '/staff' },
    { icon: UserPlus, label: 'Patients', href: '/patients' },
    { icon: Calendar, label: 'Appointments', href: '/appointments' },
    { icon: CreditCard, label: 'Billing', href: '/billing' },
    { icon: Activity, label: 'Reports', href: '/reports' },
  ],
  DOCTOR: [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Stethoscope, label: 'Doctor Console', href: '/doctor' },
    { icon: Clock, label: 'My Availability', href: '/admin/doctor-availability' },
    { icon: UserPlus, label: 'Patients', href: '/patients' },
    { icon: FileText, label: 'Prescriptions', href: '/prescriptions' },
    { icon: ClipboardList, label: 'Queue Management', href: '/queue' },
    { icon: Calendar, label: 'Appointments', href: '/appointments' },
  ],
  RECEPTIONIST: [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: UserPlus, label: 'Patient Registration', href: '/patients/register' },
    { icon: Calendar, label: 'Appointments', href: '/appointments' },
    { icon: Clock, label: 'Doctor Schedules', href: '/admin/doctor-availability' },
    { icon: ClipboardList, label: 'Queue Management', href: '/queue' },
    { icon: CreditCard, label: 'Billing', href: '/billing' },
    { icon: Users, label: 'Patients', href: '/patients' },
  ],
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session?.user) return null

  const userMenuItems = menuItems[session.user.role as keyof typeof menuItems] || []

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">HMS</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {session.user.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {(session.user as any).role?.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {userMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5 text-gray-400" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
