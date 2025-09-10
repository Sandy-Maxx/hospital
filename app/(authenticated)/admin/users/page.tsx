"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
} from "lucide-react";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
  isActive: boolean;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  suspendedUntil?: string;
  createdAt: string;
  lastLogin?: string;
  department?: string;
  specialization?: string;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
  department?: string;
  specialization?: string;
}

export default function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    password: "",
    role: "RECEPTIONIST",
    department: "",
    specialization: "",
  });

  const roles = [
    {
      value: "ADMIN",
      label: "Administrator",
      color: "bg-red-100 text-red-800",
    },
    { value: "DOCTOR", label: "Doctor", color: "bg-blue-100 text-blue-800" },
    { value: "NURSE", label: "Nurse", color: "bg-green-100 text-green-800" },
    {
      value: "RECEPTIONIST",
      label: "Receptionist",
      color: "bg-purple-100 text-purple-800",
    },
  ];

  const [departments, setDepartments] = useState<string[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [suspensionDate, setSuspensionDate] = useState<string>("");

  // Default departments and designations as fallback
  const defaultDepartments = [
    "Cardiology", "Emergency", "General Medicine", "Pediatrics", "Orthopedics", 
    "Neurology", "Radiology", "Laboratory", "Administration", "Front Desk", 
    "Billing", "Pharmacy", "Surgery", "ICU", "Dermatology", "Psychiatry"
  ];
  
  const defaultDesignations = [
    "Cardiologist", "Emergency Medicine", "General Practitioner", "Pediatrician", 
    "Orthopedic Surgeon", "Neurologist", "Radiologist", "Lab Technician", 
    "Administrator", "Receptionist", "Billing Specialist", "Pharmacist",
    "Surgeon", "ICU Specialist", "Dermatologist", "Psychiatrist", "Nurse Practitioner",
    "Registered Nurse", "Licensed Practical Nurse", "Nursing Assistant"
  ];

  useEffect(() => {
    fetch("/api/settings/lookups")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setDepartments(
            Array.isArray(data.departments) && data.departments.length > 0 
              ? data.departments 
              : defaultDepartments
          );
          setDesignations(
            Array.isArray(data.designations) && data.designations.length > 0 
              ? data.designations 
              : defaultDesignations
          );
        } else {
          // Fallback to defaults if API fails
          setDepartments(defaultDepartments);
          setDesignations(defaultDesignations);
        }
      })
      .catch(() => {
        // Fallback to defaults if network fails
        setDepartments(defaultDepartments);
        setDesignations(defaultDesignations);
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // API failed; show fallback mock data
        setUsers([
          {
            id: "1",
            name: "System Administrator",
            email: "admin@hospital.com",
            role: "ADMIN",
            isActive: true,
            createdAt: "2024-01-15T10:00:00Z",
            lastLogin: "2024-01-20T14:30:00Z",
          },
          {
            id: "2",
            name: "Dr. Sarah Johnson",
            email: "dr.sarah@hospital.com",
            role: "DOCTOR",
            isActive: true,
            createdAt: "2024-01-16T09:00:00Z",
            lastLogin: "2024-01-20T08:15:00Z",
            department: "Cardiology",
            specialization: "Heart Disease",
          },
          {
            id: "3",
            name: "Dr. Michael Chen",
            email: "dr.michael@hospital.com",
            role: "DOCTOR",
            isActive: true,
            createdAt: "2024-01-17T11:00:00Z",
            lastLogin: "2024-01-19T16:45:00Z",
            department: "General Medicine",
            specialization: "Family Medicine",
          },
          {
            id: "4",
            name: "Mary Williams",
            email: "nurse.mary@hospital.com",
            role: "NURSE",
            isActive: true,
            createdAt: "2024-01-18T08:00:00Z",
            lastLogin: "2024-01-20T07:30:00Z",
            department: "Emergency",
          },
          {
            id: "5",
            name: "Lisa Anderson",
            email: "reception2@hospital.com",
            role: "RECEPTIONIST",
            isActive: false,
            createdAt: "2024-01-19T13:00:00Z",
            lastLogin: "2024-01-18T17:00:00Z",
          },
        ]);
        toast.error("Failed to fetch users - showing sample data");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        toast.success("User created successfully");
        setShowAddModal(false);
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "RECEPTIONIST",
          department: "",
          specialization: "",
        });
        fetchUsers();
      } else {
        toast.error("Failed to create user");
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(
          `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
        );
        fetchUsers();
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !editingUser.name || !editingUser.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          department: editingUser.department,
          specialization: editingUser.specialization,
        }),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return roleConfig?.color || "bg-gray-100 text-gray-800";
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Administrator privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
          <p className="text-gray-600 mt-2">
            Manage system users, roles, and permissions
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center"
        >
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
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {user.name}
                        </h3>
                        <Badge className={getRoleColor(user.role)}>
                          {roles.find((r) => r.value === user.role)?.label}
                        </Badge>
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.department && (
                        <p className="text-sm text-gray-500">
                          {user.department}{" "}
                          {user.specialization && `• ${user.specialization}`}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>
                          Created:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                        {user.lastLogin && (
                          <span>
                            Last login:{" "}
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.isActive)
                      }
                    >
                      {user.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <a
                      className="inline-flex items-center justify-center px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      href={`/profile?userId=${user.id}`}
                      title="Edit Profile"
                    >
                      Profile
                    </a>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Edit User Account</CardTitle>
                  <CardDescription className="text-blue-100">
                    Update user information and permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Basic Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      value={editingUser.name}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, name: e.target.value } : null,
                        )
                      }
                      placeholder="Enter full name"
                      className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, email: e.target.value } : null,
                        )
                      }
                      placeholder="Enter email address"
                      className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-role" className="text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="edit-role"
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev ? { ...prev, role: e.target.value as any } : null,
                        )
                      }
                      className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Professional Details
                  </h3>
                  
                  {(editingUser.role === "DOCTOR" ||
                    editingUser.role === "NURSE" ||
                    editingUser.role === "RECEPTIONIST") && (
                    <div>
                      <Label htmlFor="edit-department" className="text-sm font-medium text-gray-700">
                        Department {editingUser.role === "DOCTOR" && <span className="text-red-500">*</span>}
                      </Label>
                      <select
                        id="edit-department"
                        value={editingUser.department || ""}
                        onChange={(e) =>
                          setEditingUser((prev) =>
                            prev ? { ...prev, department: e.target.value } : null,
                          )
                        }
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {editingUser.role === "DOCTOR" && (
                    <div>
                      <Label htmlFor="edit-specialization" className="text-sm font-medium text-gray-700">
                        Specialization
                      </Label>
                      <select
                        id="edit-specialization"
                        value={editingUser.specialization || ""}
                        onChange={(e) =>
                          setEditingUser((prev) =>
                            prev
                              ? { ...prev, specialization: e.target.value }
                              : null,
                          )
                        }
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select Specialization</option>
                        {designations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Account Status Management */}
                  <div className="pt-4 space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Account Status</h4>
                    
                    <div>
                      <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                        Account Status <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="edit-status"
                        value={editingUser.status || (editingUser.isActive ? 'ACTIVE' : 'INACTIVE')}
                        onChange={(e) => {
                          const status = e.target.value as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
                          setEditingUser((prev) =>
                            prev ? { 
                              ...prev, 
                              status: status,
                              isActive: status === 'ACTIVE',
                              suspendedUntil: status !== 'SUSPENDED' ? undefined : prev.suspendedUntil
                            } : null,
                          )
                        }}
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="ACTIVE">✅ Active</option>
                        <option value="INACTIVE">❌ Inactive</option>
                        <option value="SUSPENDED">⏸️ Suspended</option>
                      </select>
                    </div>
                    
                    {(editingUser.status === 'SUSPENDED' || (!editingUser.status && !editingUser.isActive)) && (
                      <div>
                        <Label htmlFor="edit-suspension-date" className="text-sm font-medium text-gray-700">
                          {editingUser.status === 'SUSPENDED' ? 'Suspended Until' : 'Suspension End Date'}
                        </Label>
                        <Input
                          id="edit-suspension-date"
                          type="datetime-local"
                          value={editingUser.suspendedUntil ? editingUser.suspendedUntil.slice(0, 16) : suspensionDate}
                          onChange={(e) => {
                            setSuspensionDate(e.target.value);
                            setEditingUser((prev) =>
                              prev ? { ...prev, suspendedUntil: e.target.value } : null,
                            )
                          }}
                          min={new Date().toISOString().slice(0, 16)}
                          className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          User will be automatically reactivated after this date
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            editingUser.status === 'SUSPENDED' || (editingUser.status === 'INACTIVE' || (!editingUser.status && !editingUser.isActive)) 
                              ? 'bg-red-500' 
                              : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Current Status: {editingUser.status || (editingUser.isActive ? 'Active' : 'Inactive')}
                          </h3>
                          <div className="mt-1 text-sm text-blue-700">
                            {editingUser.status === 'SUSPENDED' && editingUser.suspendedUntil ? (
                              <p>Account suspended until {new Date(editingUser.suspendedUntil).toLocaleString()}</p>
                            ) : editingUser.status === 'ACTIVE' || editingUser.isActive ? (
                              <p>User can log in and access the system</p>
                            ) : (
                              <p>User cannot log in or access the system</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="px-6 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditUser} 
                  className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={!editingUser.name || !editingUser.email}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Update User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Add New User</CardTitle>
                  <CardDescription className="text-green-100">
                    Create a new user account with proper permissions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Account Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter full name"
                      className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter email address"
                      className="mt-1 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="Enter password (min. 8 characters)"
                        className="focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-10"
                        minLength={8}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Professional Details
                  </h3>
                  
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          role: e.target.value as any,
                        }))
                      }
                      className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(newUser.role === "DOCTOR" || newUser.role === "NURSE" || newUser.role === "RECEPTIONIST") && (
                    <div>
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                        Department {newUser.role === "DOCTOR" && <span className="text-red-500">*</span>}
                      </Label>
                      <select
                        id="department"
                        value={newUser.department || ""}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newUser.role === "DOCTOR" && (
                    <div>
                      <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">
                        Specialization
                      </Label>
                      <select
                        id="specialization"
                        value={newUser.specialization || ""}
                        onChange={(e) =>
                          setNewUser((prev) => ({
                            ...prev,
                            specialization: e.target.value,
                          }))
                        }
                        className="w-full mt-1 p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      >
                        <option value="">Select Specialization</option>
                        {designations.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Helper Text */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Plus className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Creating New Account
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>The user will be created with active status and can log in immediately.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateUser} 
                  className="px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  disabled={!newUser.name || !newUser.email || !newUser.password || newUser.password.length < 8}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
