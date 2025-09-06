'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, Plus, Edit, Trash2, Search, Shield, UserCheck, UserX, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'
  isActive: boolean
  createdAt: string
  lastLogin?: string
  department?: string
  specialization?: string
}

interface NewUser {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'
  department?: string
  specialization?: string
}

export default function UserManagement() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST',
    department: '',
    specialization: ''
  })

  const roles = [
    { value: 'ADMIN', label: 'Administrator', color: 'bg-red-100 text-red-800' },
    { value: 'DOCTOR', label: 'Doctor', color: 'bg-blue-100 text-blue-800' },
    { value: 'NURSE', label: 'Nurse', color: 'bg-green-100 text-green-800' },
    { value: 'RECEPTIONIST', label: 'Receptionist', color: 'bg-purple-100 text-purple-800' }
  ]

  const departments = [
    'Cardiology', 'Emergency', 'General Medicine', 'Pediatrics', 'Orthopedics', 
    'Neurology', 'Oncology', 'Radiology', 'Surgery', 'Psychiatry'
  ]

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        // Mock data for demonstration
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'System Administrator',
            email: 'admin@hospital.com',
            role: 'ADMIN',
            isActive: true,
            createdAt: '2024-01-15T10:00:00Z',
            lastLogin: '2024-01-20T14:30:00Z'
          },
          {
            id: '2',
            name: 'Dr. Sarah Johnson',
            email: 'dr.sarah@hospital.com',
            role: 'DOCTOR',
            isActive: true,
            createdAt: '2024-01-16T09:00:00Z',
            lastLogin: '2024-01-20T08:15:00Z',
            department: 'Cardiology',
            specialization: 'Heart Disease'
          },
          {
            id: '3',
            name: 'Dr. Michael Chen',
            email: 'dr.michael@hospital.com',
            role: 'DOCTOR',
            isActive: true,
            createdAt: '2024-01-17T11:00:00Z',
            lastLogin: '2024-01-19T16:45:00Z',
            department: 'General Medicine',
            specialization: 'Family Medicine'
          },
          {
            id: '4',
            name: 'Mary Williams',
            email: 'nurse.mary@hospital.com',
            role: 'NURSE',
            isActive: true,
            createdAt: '2024-01-18T08:00:00Z',
            lastLogin: '2024-01-20T07:30:00Z',
            department: 'Emergency'
          },
          {
            id: '5',
            name: 'Lisa Anderson',
            email: 'reception2@hospital.com',
            role: 'RECEPTIONIST',
            isActive: false,
            createdAt: '2024-01-19T13:00:00Z',
            lastLogin: '2024-01-18T17:00:00Z'
          }
        ]
        setUsers(mockUsers)
      }
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        toast.success('User created successfully')
        setShowAddModal(false)
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'RECEPTIONIST',
          department: '',
          specialization: ''
        })
        fetchUsers()
      } else {
        toast.error('Failed to create user')
      }
    } catch (error) {
      toast.error('Failed to create user')
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleEditUser = async () => {
    if (!editingUser || !editingUser.name || !editingUser.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          department: editingUser.department,
          specialization: editingUser.specialization
        })
      })

      if (response.ok) {
        toast.success('User updated successfully')
        setShowEditModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        toast.error('Failed to update user')
      }
    } catch (error) {
      toast.error('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'ALL' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role)
    return roleConfig?.color || 'bg-gray-100 text-gray-800'
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">Access denied. Administrator privileges required.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Manage system users, roles, and permissions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Roles</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <Badge className={getRoleColor(user.role)}>
                          {roles.find(r => r.value === user.role)?.label}
                        </Badge>
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.department && (
                        <p className="text-sm text-gray-500">
                          {user.department} {user.specialization && `• ${user.specialization}`}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                        {user.lastLogin && (
                          <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                    >
                      {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user)
                        setShowEditModal(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit User</CardTitle>
              <CardDescription>Update user information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <select
                  id="edit-role"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as any } : null)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {(editingUser.role === 'DOCTOR' || editingUser.role === 'NURSE') && (
                <>
                  <div>
                    <Label htmlFor="edit-department">Department</Label>
                    <select
                      id="edit-department"
                      value={editingUser.department || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, department: e.target.value } : null)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {editingUser.role === 'DOCTOR' && (
                    <div>
                      <Label htmlFor="edit-specialization">Specialization</Label>
                      <Input
                        id="edit-specialization"
                        value={editingUser.specialization || ''}
                        onChange={(e) => setEditingUser(prev => prev ? { ...prev, specialization: e.target.value } : null)}
                        placeholder="Enter specialization"
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="flex space-x-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleEditUser} className="flex-1">
                  Update User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
              <CardDescription>Create a new user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {(newUser.role === 'DOCTOR' || newUser.role === 'NURSE') && (
                <>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={newUser.department}
                      onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {newUser.role === 'DOCTOR' && (
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={newUser.specialization}
                        onChange={(e) => setNewUser(prev => ({ ...prev, specialization: e.target.value }))}
                        placeholder="Enter specialization"
                      />
                    </div>
                  )}
                </>
              )}
              
              <div className="flex space-x-4 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} className="flex-1">
                  Create User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
