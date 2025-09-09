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
  Search,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Shield,
  Stethoscope,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
  department: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  joinDate: string;
}

export default function StaffManagement() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [newStaff, setNewStaff] = useState<{
    name: string;
    email: string;
    role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";
    department: string;
    phone: string;
  }>({
    name: "",
    email: "",
    role: "RECEPTIONIST",
    department: "",
    phone: "",
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockStaff: Staff[] = [
      {
        id: "1",
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@hospital.com",
        role: "DOCTOR",
        department: "Cardiology",
        phone: "+1 (555) 123-4567",
        status: "ACTIVE",
        joinDate: "2023-01-15",
      },
      {
        id: "2",
        name: "Michael Chen",
        email: "michael.chen@hospital.com",
        role: "ADMIN",
        department: "Administration",
        phone: "+1 (555) 234-5678",
        status: "ACTIVE",
        joinDate: "2022-08-20",
      },
      {
        id: "3",
        name: "Emily Rodriguez",
        email: "emily.rodriguez@hospital.com",
        role: "RECEPTIONIST",
        department: "Front Desk",
        phone: "+1 (555) 345-6789",
        status: "ACTIVE",
        joinDate: "2023-03-10",
      },
      {
        id: "4",
        name: "Dr. James Wilson",
        email: "james.wilson@hospital.com",
        role: "DOCTOR",
        department: "Emergency",
        phone: "+1 (555) 456-7890",
        status: "ACTIVE",
        joinDate: "2022-11-05",
      },
      {
        id: "5",
        name: "Lisa Thompson",
        email: "lisa.thompson@hospital.com",
        role: "RECEPTIONIST",
        department: "Billing",
        phone: "+1 (555) 567-8901",
        status: "INACTIVE",
        joinDate: "2023-02-28",
      },
    ];
    setStaff(mockStaff);
  }, []);

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddStaff = () => {
    const newMember: Staff = {
      id: Date.now().toString(),
      ...newStaff,
      status: "ACTIVE",
      joinDate: new Date().toISOString().split("T")[0],
    } as Staff;
    setStaff([...staff, newMember]);
    setNewStaff({
      name: "",
      email: "",
      role: "RECEPTIONIST",
      department: "",
      phone: "",
    });
    setShowAddForm(false);
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter((member) => member.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setNewStaff({
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      phone: member.phone,
    });
    setShowAddForm(true);
  };

  const handleUpdateStaff = () => {
    if (editingStaff) {
      const updatedStaff = staff.map((member) =>
        member.id === editingStaff.id ? { ...member, ...newStaff } : member,
      );
      setStaff(updatedStaff);
    }
    setEditingStaff(null);
    setNewStaff({
      name: "",
      email: "",
      role: "RECEPTIONIST",
      department: "",
      phone: "",
    });
    setShowAddForm(false);
  };

  const departments = [
    "Cardiology",
    "Emergency",
    "General Medicine",
    "Pediatrics",
    "Orthopedics",
    "Neurology",
    "Radiology",
    "Laboratory",
    "Administration",
    "Front Desk",
    "Billing",
    "Pharmacy",
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "DOCTOR":
        return <Stethoscope className="w-4 h-4" />;
      case "RECEPTIONIST":
        return <UserCheck className="w-4 h-4" />;
      case "NURSE":
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "RECEPTIONIST":
        return "bg-green-100 text-green-800";
      case "NURSE":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "DOCTOR") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Access denied. Admin or Doctor privileges required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">
            Manage hospital staff members and their roles
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Stethoscope className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doctors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter((s) => s.role === "DOCTOR").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Receptionists
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter((s) => s.role === "RECEPTIONIST").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staff.filter((s) => s.role === "ADMIN").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search staff by name, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </CardTitle>
            <CardDescription>
              {editingStaff
                ? "Update the staff member details"
                : "Enter the details for the new staff member"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({
                      ...newStaff,
                      role: e.target.value as
                        | "ADMIN"
                        | "DOCTOR"
                        | "NURSE"
                        | "RECEPTIONIST",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="NURSE">Nurse</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {newStaff.role === "DOCTOR" ? (
                  <select
                    id="department"
                    value={newStaff.department}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, department: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {departments
                      .filter(
                        (dept) =>
                          !["Administration", "Front Desk", "Billing"].includes(
                            dept,
                          ),
                      )
                      .map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    id="department"
                    value={newStaff.department}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, department: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newStaff.phone}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, phone: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={editingStaff ? handleUpdateStaff : handleAddStaff}
              >
                {editingStaff ? "Update Staff Member" : "Add Staff Member"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStaff(null);
                  setNewStaff({
                    name: "",
                    email: "",
                    role: "RECEPTIONIST",
                    department: "",
                    phone: "",
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members ({filteredStaff.length})</CardTitle>
          <CardDescription>Manage your hospital staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-sm text-gray-500">{member.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getRoleColor(member.role)}>
                    {member.role}
                  </Badge>
                  <Badge
                    variant={
                      member.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {member.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStaff(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Deletion</CardTitle>
              <CardDescription>
                Are you sure you want to delete this staff member? This action
                cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteStaff(showDeleteConfirm)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
