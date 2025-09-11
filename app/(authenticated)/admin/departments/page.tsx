"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import * as Lucide from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import IconPicker from "@/components/ui/icon-picker";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export default function DepartmentsPage() {
  const [list, setList] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState<string>("#3B82F6");
  const [icon, setIcon] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.success) setList(data.departments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setCode("");
    setSortOrder(0);
    setColor("#3B82F6");
    setIcon("");
  };

  const save = async () => {
    try {
      const payload: any = { name: name.trim(), code: code.trim().toUpperCase(), sortOrder, color, icon };
      if (!payload.name || !payload.code) {
        toast({ variant: "destructive", title: "Error", description: "Name and Code are required" });
        return;
      }
      const url = editing ? `/api/departments/${editing.id}` : "/api/departments";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Saved", description: `Department ${editing ? "updated" : "created"}` });
        setFormOpen(false);
        resetForm();
        load();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to save" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save" });
    }
  };

  const handleEdit = (d: any) => {
    setEditing(d);
    setName(d.name || "");
    setCode(d.code || "");
    setColor(d.color || "#3B82F6");
    setIcon(d.icon || "");
    setSortOrder(d.sortOrder || 0);
    setFormOpen(true);
  };

  const handleToggleActive = async (d: any) => {
    try {
      const res = await fetch(`/api/departments/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        load();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to update" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: "Department removed" });
        load();
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to delete" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage hospital departments used across the system</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/settings" className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
            ← Back to Settings
          </a>
          <Button onClick={() => setFormOpen(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" /> New Department
          </Button>
        </div>
      </div>

      {formOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Department" : "New Department"}</CardTitle>
            <CardDescription>Define a department name, code, and optional sort order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cardiology" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CARD" />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 h-10" />
                <select value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 h-10 px-3 border border-input rounded-md">
                  <option value="#3B82F6">Blue</option>
                  <option value="#EF4444">Red</option>
                  <option value="#10B981">Green</option>
                  <option value="#F59E0B">Yellow</option>
                  <option value="#8B5CF6">Purple</option>
                  <option value="#EC4899">Pink</option>
                  <option value="#6366F1">Indigo</option>
                  <option value="#F97316">Orange</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
            </div>
          </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={save}>{editing ? "Update" : "Save"}</Button>
              <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Departments ({list.length})</CardTitle>
            <CardDescription>All departments configured in the system</CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">No departments found</TableCell>
                </TableRow>
              ) : (
                list
                  .slice()
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name))
                  .map((d: any) => {
                    const IconComp = d.icon && (Lucide as any)[d.icon] ? (Lucide as any)[d.icon] : null;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: d.color || '#3B82F6' }}
                            />
                            <span>{d.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{d.code}</TableCell>
                        <TableCell>
                          {IconComp ? (
                            <IconComp className="w-4 h-4" style={{ color: d.color || '#3B82F6' }} />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={d.isActive ? "default" : "secondary"}>
                              {d.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Switch checked={d.isActive} onCheckedChange={() => handleToggleActive(d)} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{d.sortOrder || 0}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(d)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{d.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(d.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

