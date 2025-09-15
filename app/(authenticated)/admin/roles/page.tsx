"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Plus, Edit, Trash2, Users, Settings, 
  Lock, Unlock, Check, X, Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

interface Permission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  module: string;
  action: string;
  isActive: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: Permission[];
  userCount?: number;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Role form state
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
    selectedPermissions: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch roles
      const rolesResponse = await fetch("/api/roles");
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles);
      }

      // Fetch permissions
      const permissionsResponse = await fetch("/api/permissions");
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions);
        
        // Group permissions by module
        const groups = permissionsData.permissions.reduce((acc: PermissionGroup[], perm: Permission) => {
          const existingGroup = acc.find(g => g.module === perm.module);
          if (existingGroup) {
            existingGroup.permissions.push(perm);
          } else {
            acc.push({ module: perm.module, permissions: [perm] });
          }
          return acc;
        }, []);
        
        setPermissionGroups(groups.sort((a: PermissionGroup, b: PermissionGroup) => a.module.localeCompare(b.module)));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async () => {
    try {
      const method = editingRole ? "PUT" : "POST";
      const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleForm.name,
          displayName: roleForm.displayName,
          description: roleForm.description,
          permissions: roleForm.selectedPermissions
        })
      });

      if (response.ok) {
        toast.success(editingRole ? "Role updated successfully" : "Role created successfully");
        setIsRoleDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save role");
      }
    } catch (error) {
      toast.error("Failed to save role");
    }
  };

  const handleEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      selectedPermissions: role.permissions.map(p => p.id)
    });
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Role deleted successfully");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete role");
      }
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  const togglePermission = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }));
  };

  const toggleModulePermissions = (modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => roleForm.selectedPermissions.includes(id));
    
    setRoleForm(prev => ({
      ...prev,
      selectedPermissions: allSelected
        ? prev.selectedPermissions.filter(id => !modulePermissionIds.includes(id))
        : [...prev.selectedPermissions, ...modulePermissionIds.filter(id => !prev.selectedPermissions.includes(id))]
    }));
  };

  const resetForm = () => {
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
      selectedPermissions: []
    });
    setEditingRole(null);
  };

  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Create and manage custom roles with granular permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
                <DialogDescription>
                  {editingRole ? "Modify role settings and permissions" : "Create a new custom role with specific permissions"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roleName">Role Name (Internal) *</Label>
                    <Input
                      id="roleName"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                      placeholder="e.g., SENIOR_NURSE"
                      disabled={!!editingRole}
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={roleForm.displayName}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="e.g., Senior Nurse"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the role and responsibilities"
                    className="h-20"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">Permissions ({roleForm.selectedPermissions.length} selected)</Label>
                  <div className="mt-3 space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {permissionGroups.map((group) => {
                      const groupSelected = group.permissions.filter(p => roleForm.selectedPermissions.includes(p.id)).length;
                      const groupTotal = group.permissions.length;
                      const allGroupSelected = groupSelected === groupTotal;
                      
                      return (
                        <div key={group.module} className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={allGroupSelected}
                                onChange={() => toggleModulePermissions(group.permissions)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="font-medium capitalize">{group.module.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <Badge variant="secondary">{groupSelected}/{groupTotal}</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-1 ml-6">
                            {group.permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  id={permission.id}
                                  checked={roleForm.selectedPermissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor={permission.id} className="text-sm flex-1 cursor-pointer">
                                  <span className="font-medium">{permission.displayName}</span>
                                  {permission.description && (
                                    <span className="text-gray-500 ml-1">- {permission.description}</span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateRole} 
                    disabled={!roleForm.name || !roleForm.displayName || roleForm.selectedPermissions.length === 0}
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">Custom Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <Card key={role.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {role.displayName}
                    </CardTitle>
                    {role.isSystem && (
                      <Badge variant="secondary">System</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{role.name}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {role.description && (
                      <p className="text-sm text-gray-700">{role.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Permissions:</span>
                      <Badge variant="outline">{role.permissions.length}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Users:</span>
                      <Badge variant="outline">{role.userCount || 0}</Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={role.isActive ? "default" : "secondary"}>
                        {role.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleEditRole(role)}
                        disabled={role.isSystem}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteRole(role.id, role.displayName)}
                        disabled={role.isSystem || Boolean(role.userCount && role.userCount > 0)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No roles found matching your search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <div className="space-y-6">
            {permissionGroups.map((group) => (
              <Card key={group.module}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between capitalize">
                    <span>{group.module.replace(/([A-Z])/g, ' $1').trim()} Module</span>
                    <Badge variant="outline">{group.permissions.length} permissions</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {group.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{permission.displayName}</h4>
                          <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{permission.action}</Badge>
                            <Badge variant={permission.isActive ? "default" : "secondary"} className="text-xs">
                              {permission.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
