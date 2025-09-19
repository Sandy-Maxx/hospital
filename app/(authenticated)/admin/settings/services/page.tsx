"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  Zap,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Timer,
  IndianRupee,
  Building2,
  Search,
  Clock,
  Stethoscope,
  Eye,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/navigation/breadcrumb";

interface OTService {
  id: string;
  name: string;
  basePrice: number;
  duration?: number;
  category?: string;
  department?: string;
  description?: string;
  isActive: boolean;
  procedures?: OTProcedure[];
  _count?: { procedures: number };
}

interface OTProcedure {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  code?: string;
  duration?: number;
  complexity?: string;
  anesthesia?: string;
  description?: string;
  billingDefaults?: any;
  isActive: boolean;
  service?: { name: string; category?: string };
}

interface ImagingService {
  id: string;
  name: string;
  basePrice: number;
  duration?: number;
  category?: string;
  modality: string;
  bodyPart?: string;
  contrast: boolean;
  description?: string;
  isActive: boolean;
  procedures?: ImagingProcedure[];
  _count?: { procedures: number };
}

interface ImagingProcedure {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  code?: string;
  duration?: number;
  preparation?: string;
  contrastAgent?: string;
  description?: string;
  billingDefaults?: any;
  isActive: boolean;
  service?: { name: string; modality: string };
}

const otCategories = ["MAJOR", "MINOR", "EMERGENCY", "DAY_CARE"];
const otComplexities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const anesthesiaTypes = ["LOCAL", "GENERAL", "SPINAL", "EPIDURAL"];
const imagingModalities = ["X-RAY", "CT", "MRI", "ULTRASOUND", "MAMMOGRAPHY", "NUCLEAR"];
const imagingCategories = ["ROUTINE", "CONTRAST", "EMERGENCY", "SPECIALIZED"];
const bodyParts = ["CHEST", "ABDOMEN", "HEAD", "SPINE", "EXTREMITIES", "PELVIS"];

export default function ServicesManagementPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("ot-services");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // OT Services State
  const [otServices, setOtServices] = useState<OTService[]>([]);
  const [otProcedures, setOtProcedures] = useState<OTProcedure[]>([]);
  const [showOtServiceDialog, setShowOtServiceDialog] = useState(false);
  const [showOtProcedureDialog, setShowOtProcedureDialog] = useState(false);
  const [editingOtService, setEditingOtService] = useState<OTService | null>(null);
  const [editingOtProcedure, setEditingOtProcedure] = useState<OTProcedure | null>(null);

  // Imaging Services State
  const [imagingServices, setImagingServices] = useState<ImagingService[]>([]);
  const [imagingProcedures, setImagingProcedures] = useState<ImagingProcedure[]>([]);
  const [showImagingServiceDialog, setShowImagingServiceDialog] = useState(false);
  const [showImagingProcedureDialog, setShowImagingProcedureDialog] = useState(false);
  const [editingImagingService, setEditingImagingService] = useState<ImagingService | null>(null);
  const [editingImagingProcedure, setEditingImagingProcedure] = useState<ImagingProcedure | null>(null);

  // Filters & Lookups
  const [includeInactive, setIncludeInactive] = useState(false);
  const [departmentsLookup, setDepartmentsLookup] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalOtServices: 0,
    totalOtProcedures: 0,
    totalImagingServices: 0,
    totalImagingProcedures: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (session?.user) {
      loadAllData();
    }
  }, [session, includeInactive]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOtServices(),
        fetchImagingServices(), 
        fetchOtProcedures(),
        fetchImagingProcedures()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load lookups (departments)
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const res = await fetch('/api/settings/lookups');
        if (res.ok) {
          const data = await res.json();
          setDepartmentsLookup(Array.isArray(data.departments) ? data.departments : []);
        }
      } catch (e) {
        // ignore
      }
    };
    loadLookups();
  }, []);

  const fetchOtServices = async () => {
    try {
      const res = await fetch('/api/hospital/ot-services' + (includeInactive ? '?includeInactive=true' : ''));
      if (res.ok) {
        const data = await res.json();
        setOtServices(data.services);
        updateStats('otServices', data.services);
      } else {
        toast.error('Failed to fetch OT services');
      }
    } catch (error) {
      toast.error('Error fetching OT services');
    }
  };

  const fetchImagingServices = async () => {
    try {
      const res = await fetch('/api/hospital/imaging-services' + (includeInactive ? '?includeInactive=true' : ''));
      if (res.ok) {
        const data = await res.json();
        setImagingServices(data.services);
        updateStats('imagingServices', data.services);
      } else {
        toast.error('Failed to fetch Imaging services');
      }
    } catch (error) {
      toast.error('Error fetching Imaging services');
    }
  };

  const fetchOtProcedures = async () => {
    try {
      const res = await fetch('/api/hospital/ot-procedures' + (includeInactive ? '?includeInactive=true' : ''));
      if (res.ok) {
        const data = await res.json();
        setOtProcedures(data.procedures);
        updateStats('otProcedures', data.procedures);
      }
    } catch (error) {
      console.error('Error fetching OT procedures:', error);
    }
  };

  const fetchImagingProcedures = async () => {
    try {
      const res = await fetch('/api/hospital/imaging-procedures' + (includeInactive ? '?includeInactive=true' : ''));
      if (res.ok) {
        const data = await res.json();
        setImagingProcedures(data.procedures);
        updateStats('imagingProcedures', data.procedures);
      }
    } catch (error) {
      console.error('Error fetching Imaging procedures:', error);
    }
  };

  const updateStats = (type: string, data: any[]) => {
    setStats(prev => {
      const newStats = { ...prev };
      
      switch (type) {
        case 'otServices':
          newStats.totalOtServices = data.length;
          break;
        case 'otProcedures':
          newStats.totalOtProcedures = data.length;
          break;
        case 'imagingServices':
          newStats.totalImagingServices = data.length;
          break;
        case 'imagingProcedures':
          newStats.totalImagingProcedures = data.length;
          break;
      }
      
      // Calculate total revenue potential
      const otRevenue = otServices.reduce((sum, service) => {
        const procedureRevenue = service.procedures?.reduce((pSum, proc) => pSum + proc.price, 0) || 0;
        return sum + service.basePrice + procedureRevenue;
      }, 0);
      
      const imagingRevenue = imagingServices.reduce((sum, service) => {
        const procedureRevenue = service.procedures?.reduce((pSum, proc) => pSum + proc.price, 0) || 0;
        return sum + service.basePrice + procedureRevenue;
      }, 0);
      
      newStats.totalRevenue = otRevenue + imagingRevenue;
      
      return newStats;
    });
  };

  // Service Management Functions
  const handleOtServiceSubmit = async (data: any) => {
    try {
      const method = editingOtService ? 'PUT' : 'POST';
      const payload = editingOtService ? { ...data, id: editingOtService.id } : data;
      
      const res = await fetch('/api/hospital/ot-services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`OT service ${editingOtService ? 'updated' : 'created'} successfully`);
        setShowOtServiceDialog(false);
        setEditingOtService(null);
        fetchOtServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save OT service');
      }
    } catch (error) {
      toast.error('Error saving OT service');
    }
  };

  const handleImagingServiceSubmit = async (data: any) => {
    try {
      const method = editingImagingService ? 'PUT' : 'POST';
      const payload = editingImagingService ? { ...data, id: editingImagingService.id } : data;
      
      const res = await fetch('/api/hospital/imaging-services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Imaging service ${editingImagingService ? 'updated' : 'created'} successfully`);
        setShowImagingServiceDialog(false);
        setEditingImagingService(null);
        fetchImagingServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save Imaging service');
      }
    } catch (error) {
      toast.error('Error saving Imaging service');
    }
  };

  // Procedure Management Functions
  const handleOtProcedureSubmit = async (data: any) => {
    try {
      const method = editingOtProcedure ? 'PUT' : 'POST';
      const payload = editingOtProcedure ? { ...data, id: editingOtProcedure.id } : data;
      
      const res = await fetch('/api/hospital/ot-procedures', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`OT procedure ${editingOtProcedure ? 'updated' : 'created'} successfully`);
        setShowOtProcedureDialog(false);
        setEditingOtProcedure(null);
        fetchOtProcedures();
        fetchOtServices(); // Refresh to update procedure counts
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save OT procedure');
      }
    } catch (error) {
      toast.error('Error saving OT procedure');
    }
  };

  const handleImagingProcedureSubmit = async (data: any) => {
    try {
      const method = editingImagingProcedure ? 'PUT' : 'POST';
      const payload = editingImagingProcedure ? { ...data, id: editingImagingProcedure.id } : data;
      
      const res = await fetch('/api/hospital/imaging-procedures', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Imaging procedure ${editingImagingProcedure ? 'updated' : 'created'} successfully`);
        setShowImagingProcedureDialog(false);
        setEditingImagingProcedure(null);
        fetchImagingProcedures();
        fetchImagingServices(); // Refresh to update procedure counts
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save Imaging procedure');
      }
    } catch (error) {
      toast.error('Error saving Imaging procedure');
    }
  };

  // Delete Functions
  const handleDeleteOtService = async (service: OTService) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;
    
    try {
      const res = await fetch('/api/hospital/ot-services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id }),
      });
      
      if (res.ok) {
        toast.success('OT service deleted successfully');
        fetchOtServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete OT service');
      }
    } catch (error) {
      toast.error('Error deleting OT service');
    }
  };

  const handleDeleteImagingService = async (service: ImagingService) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;
    
    try {
      const res = await fetch('/api/hospital/imaging-services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id }),
      });
      
      if (res.ok) {
        toast.success('Imaging service deleted successfully');
        fetchImagingServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete Imaging service');
      }
    } catch (error) {
      toast.error('Error deleting Imaging service');
    }
  };

  const handleDeleteOtProcedure = async (procedure: OTProcedure) => {
    if (!confirm(`Delete OT procedure "${procedure.name}"?`)) return;
    try {
      const res = await fetch('/api/hospital/ot-procedures', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: procedure.id }),
      });
      if (res.ok) {
        toast.success('OT procedure deleted successfully');
        fetchOtProcedures();
        fetchOtServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete OT procedure');
      }
    } catch (error) {
      toast.error('Error deleting OT procedure');
    }
  };

  const handleDeleteImagingProcedure = async (procedure: ImagingProcedure) => {
    if (!confirm(`Delete Imaging procedure "${procedure.name}"?`)) return;
    try {
      const res = await fetch('/api/hospital/imaging-procedures', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: procedure.id }),
      });
      if (res.ok) {
        toast.success('Imaging procedure deleted successfully');
        fetchImagingProcedures();
        fetchImagingServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete Imaging procedure');
      }
    } catch (error) {
      toast.error('Error deleting Imaging procedure');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  if (session?.user.role !== "ADMIN") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to manage services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb 
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Services", href: "/admin/settings/services" }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-blue-600" />
            OT & Imaging Services
          </h1>
          <p className="text-gray-600 mt-2">
            Configure surgical procedures and imaging services with pricing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadAllData} disabled={loading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OT Services</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalOtServices}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OT Procedures</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalOtProcedures}</p>
              </div>
              <Timer className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Imaging Services</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalImagingServices}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Imaging Procedures</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalImagingProcedures}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Potential</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ot-services">
            <Activity className="w-4 h-4 mr-2" />
            OT Services ({otServices.length})
          </TabsTrigger>
          <TabsTrigger value="ot-procedures">
            <Timer className="w-4 h-4 mr-2" />
            OT Procedures ({otProcedures.length})
          </TabsTrigger>
          <TabsTrigger value="imaging-services">
            <Zap className="w-4 h-4 mr-2" />
            Imaging Services ({imagingServices.length})
          </TabsTrigger>
          <TabsTrigger value="imaging-procedures">
            <Eye className="w-4 h-4 mr-2" />
            Imaging Procedures ({imagingProcedures.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search services or procedures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedService && (
            <Button variant="outline" onClick={() => setSelectedService(null)}>
              <X className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Include inactive
          </label>
        </div>

        {/* OT Services Tab */}
        <TabsContent value="ot-services">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">OT Services</h2>
              <p className="text-gray-600 mt-1">Manage surgical services and their procedures</p>
            </div>
            <Button 
              onClick={() => {
                setEditingOtService(null);
                setShowOtServiceDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add OT Service
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading OT services...</p>
              </CardContent>
            </Card>
          ) : otServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No OT Services</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first OT service</p>
                <Button onClick={() => {
                  setEditingOtService(null);
                  setShowOtServiceDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {otServices
                .filter(service => 
                  !search || 
                  service.name.toLowerCase().includes(search.toLowerCase()) ||
                  service.department?.toLowerCase().includes(search.toLowerCase()) ||
                  service.category?.toLowerCase().includes(search.toLowerCase())
                )
                .map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900">{service.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          {service.category && (
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                          )}
                          {service.department && (
                            <Badge variant="secondary" className="text-xs">
                              {service.department}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingOtService(service);
                            setShowOtServiceDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteOtService(service)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Base Price:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(service.basePrice)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="text-sm font-medium">{service.duration || 60} mins</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Procedures:</span>
                        <Badge variant="outline" className="text-xs">
                          {service._count?.procedures || 0} items
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedService(service.id);
                          setActiveTab('ot-procedures');
                        }}
                      >
                        <Timer className="w-4 h-4 mr-2" />
                        View Procedures
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* OT Procedures Tab */}
        <TabsContent value="ot-procedures">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">OT Procedures</h2>
              <p className="text-gray-600 mt-1">Manage individual surgical procedures with pricing</p>
              {selectedService && (
                <Badge variant="outline" className="mt-2">
                  Filtered by: {otServices.find(s => s.id === selectedService)?.name}
                </Badge>
              )}
            </div>
            <Button 
              onClick={() => {
                setEditingOtProcedure(null);
                setShowOtProcedureDialog(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add OT Procedure
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading OT procedures...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {otProcedures
                .filter(procedure => 
                  (!selectedService || procedure.serviceId === selectedService) &&
                  (!search || 
                    procedure.name.toLowerCase().includes(search.toLowerCase()) ||
                    procedure.service?.name.toLowerCase().includes(search.toLowerCase()) ||
                    procedure.complexity?.toLowerCase().includes(search.toLowerCase())
                  )
                )
                .map((procedure) => (
                <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{procedure.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{procedure.service?.name}</p>
                        
                        {procedure.description && (
                          <p className="text-sm text-gray-600 mb-4">{procedure.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(procedure.price)}
                            </span>
                          </div>
                          
                          {procedure.duration && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{procedure.duration} mins</span>
                            </div>
                          )}
                          
                          {procedure.complexity && (
                            <Badge 
                              variant={procedure.complexity === 'HIGH' || procedure.complexity === 'CRITICAL' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {procedure.complexity}
                            </Badge>
                          )}
                          
                          {procedure.anesthesia && (
                            <Badge variant="secondary" className="text-xs">
                              {procedure.anesthesia} Anesthesia
                            </Badge>
                          )}
                          
                          {procedure.code && (
                            <Badge variant="outline" className="text-xs">
                              Code: {procedure.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingOtProcedure(procedure);
                            setShowOtProcedureDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteOtProcedure(procedure)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {otProcedures.filter(procedure => 
                (!selectedService || procedure.serviceId === selectedService) &&
                (!search || 
                  procedure.name.toLowerCase().includes(search.toLowerCase()) ||
                  procedure.service?.name.toLowerCase().includes(search.toLowerCase())
                )
              ).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Timer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No OT Procedures Found</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedService 
                        ? 'No procedures found for the selected service' 
                        : 'Get started by creating your first OT procedure'
                      }
                    </p>
                    <Button onClick={() => {
                      setEditingOtProcedure(null);
                      setShowOtProcedureDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Procedure
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Imaging Services Tab */}
        <TabsContent value="imaging-services">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Imaging Services</h2>
              <p className="text-gray-600 mt-1">Manage diagnostic imaging services</p>
            </div>
            <Button 
              onClick={() => {
                setEditingImagingService(null);
                setShowImagingServiceDialog(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Imaging Service
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading imaging services...</p>
              </CardContent>
            </Card>
          ) : imagingServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Imaging Services</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first imaging service</p>
                <Button onClick={() => {
                  setEditingImagingService(null);
                  setShowImagingServiceDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {imagingServices
                .filter(service => 
                  !search || 
                  service.name.toLowerCase().includes(search.toLowerCase()) ||
                  service.modality?.toLowerCase().includes(search.toLowerCase()) ||
                  service.category?.toLowerCase().includes(search.toLowerCase())
                )
                .map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900">{service.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="default" className="text-xs bg-purple-600">
                            {service.modality}
                          </Badge>
                          {service.category && (
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                          )}
                          {service.contrast && (
                            <Badge variant="secondary" className="text-xs">
                              Contrast Required
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingImagingService(service);
                            setShowImagingServiceDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteImagingService(service)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {service.description && (
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Base Price:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(service.basePrice)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="text-sm font-medium">{service.duration || 30} mins</span>
                      </div>
                      
                      {service.bodyPart && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Body Part:</span>
                          <Badge variant="outline" className="text-xs">
                            {service.bodyPart}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Procedures:</span>
                        <Badge variant="outline" className="text-xs">
                          {service._count?.procedures || 0} items
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedService(service.id);
                          setActiveTab('imaging-procedures');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Procedures
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Imaging Procedures Tab */}
        <TabsContent value="imaging-procedures">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Imaging Procedures</h2>
              <p className="text-gray-600 mt-1">Manage diagnostic imaging procedures with pricing</p>
              {selectedService && (
                <Badge variant="outline" className="mt-2">
                  Filtered by: {imagingServices.find(s => s.id === selectedService)?.name}
                </Badge>
              )}
            </div>
            <Button 
              onClick={() => {
                setEditingImagingProcedure(null);
                setShowImagingProcedureDialog(true);
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Imaging Procedure
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading imaging procedures...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {imagingProcedures
                .filter(procedure => 
                  (!selectedService || procedure.serviceId === selectedService) &&
                  (!search || 
                    procedure.name.toLowerCase().includes(search.toLowerCase()) ||
                    procedure.service?.name.toLowerCase().includes(search.toLowerCase()) ||
                    procedure.preparation?.toLowerCase().includes(search.toLowerCase())
                  )
                )
                .map((procedure) => (
                <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{procedure.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {procedure.service?.name} • {procedure.service?.modality}
                        </p>
                        
                        {procedure.description && (
                          <p className="text-sm text-gray-600 mb-4">{procedure.description}</p>
                        )}
                        
                        {procedure.preparation && (
                          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                            <p className="text-sm text-yellow-800">
                              <strong>Preparation:</strong> {procedure.preparation}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                          <div className="flex items-center space-x-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(procedure.price)}
                            </span>
                          </div>
                          
                          {procedure.duration && (
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span>{procedure.duration} mins</span>
                            </div>
                          )}
                          
                          {procedure.contrastAgent && (
                            <Badge variant="secondary" className="text-xs">
                              {procedure.contrastAgent} contrast
                            </Badge>
                          )}
                          
                          {procedure.code && (
                            <Badge variant="outline" className="text-xs">
                              Code: {procedure.code}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingImagingProcedure(procedure);
                            setShowImagingProcedureDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteImagingProcedure(procedure)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {imagingProcedures.filter(procedure => 
                (!selectedService || procedure.serviceId === selectedService) &&
                (!search || 
                  procedure.name.toLowerCase().includes(search.toLowerCase()) ||
                  procedure.service?.name.toLowerCase().includes(search.toLowerCase())
                )
              ).length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Imaging Procedures Found</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedService 
                        ? 'No procedures found for the selected service' 
                        : 'Get started by creating your first imaging procedure'
                      }
                    </p>
                    <Button onClick={() => {
                      setEditingImagingProcedure(null);
                      setShowImagingProcedureDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Procedure
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* OT Service Dialog */}
      <Dialog open={showOtServiceDialog} onOpenChange={setShowOtServiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOtService ? 'Edit OT Service' : 'Add OT Service'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get('name'),
              description: formData.get('description'),
              basePrice: parseFloat(formData.get('basePrice') as string),
              duration: parseInt(formData.get('duration') as string) || 60,
              category: formData.get('category'),
              department: formData.get('department'),
            };
            handleOtServiceSubmit(data);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingOtService?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingOtService?.basePrice}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  defaultValue={editingOtService?.duration || 60}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={editingOtService?.category || ''}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Select category --</option>
                  {otCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                name="department"
                defaultValue={editingOtService?.department || ''}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Select department --</option>
                {departmentsLookup.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={editingOtService?.description}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowOtServiceDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingOtService ? 'Update' : 'Create'} Service
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* OT Procedure Dialog */}
      <Dialog open={showOtProcedureDialog} onOpenChange={setShowOtProcedureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOtProcedure ? 'Edit OT Procedure' : 'Add OT Procedure'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const bd: any = {
              surgeonFee: parseFloat((fd.get('bd_surgeonFee') as string) || '0') || 0,
              assistantFee: parseFloat((fd.get('bd_assistantFee') as string) || '0') || 0,
              anesthesiaFee: parseFloat((fd.get('bd_anesthesiaFee') as string) || '0') || 0,
              otRoomRatePerHour: parseFloat((fd.get('bd_otRoomRatePerHour') as string) || '0') || 0,
              defaultOtRoomHours: parseFloat((fd.get('bd_defaultOtRoomHours') as string) || '0') || 0,
              emergencySurcharge: parseFloat((fd.get('bd_emergencySurcharge') as string) || '0') || 0,
              nightSurcharge: parseFloat((fd.get('bd_nightSurcharge') as string) || '0') || 0,
              weekendSurcharge: parseFloat((fd.get('bd_weekendSurcharge') as string) || '0') || 0,
            };
            const data: any = {
              serviceId: fd.get('serviceId'),
              name: fd.get('name'),
              code: fd.get('code'),
              description: fd.get('description'),
              price: parseFloat(fd.get('price') as string),
              duration: parseInt((fd.get('duration') as string) || '0') || 60,
              complexity: fd.get('complexity') || 'MEDIUM',
              anesthesia: fd.get('anesthesia') || null,
              billingDefaults: bd,
              isActive: fd.get('isActive') === 'on',
            };
            handleOtProcedureSubmit(data);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceId">Service *</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  defaultValue={editingOtProcedure?.serviceId || selectedService || ''}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Select service --</option>
                  {otServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Procedure Name *</Label>
                <Input id="name" name="name" defaultValue={editingOtProcedure?.name} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editingOtProcedure?.price} required />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min="1" defaultValue={editingOtProcedure?.duration || 60} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complexity">Complexity</Label>
                <select id="complexity" name="complexity" defaultValue={editingOtProcedure?.complexity || 'MEDIUM'} className="w-full p-2 border border-gray-300 rounded-md">
                  {otComplexities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="anesthesia">Anesthesia</Label>
                <select id="anesthesia" name="anesthesia" defaultValue={editingOtProcedure?.anesthesia || ''} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">None</option>
                  {anesthesiaTypes.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={editingOtProcedure?.code || ''} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isActive" defaultChecked={editingOtProcedure?.isActive ?? true} className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>

            {/* Billing Defaults */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded p-3">
              <div>
                <Label>Surgeon Fee (₹)</Label>
                <Input name="bd_surgeonFee" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.surgeonFee || 0} />
              </div>
              <div>
                <Label>Assistant Fee (₹)</Label>
                <Input name="bd_assistantFee" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.assistantFee || 0} />
              </div>
              <div>
                <Label>Anesthetist Fee (₹)</Label>
                <Input name="bd_anesthesiaFee" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.anesthesiaFee || 0} />
              </div>
              <div>
                <Label>OT Room Rate (₹/hour)</Label>
                <Input name="bd_otRoomRatePerHour" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.otRoomRatePerHour || 0} />
              </div>
              <div>
                <Label>Default OT Hours</Label>
                <Input name="bd_defaultOtRoomHours" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.defaultOtRoomHours || 0} />
              </div>
              <div>
                <Label>Emergency Surcharge (₹)</Label>
                <Input name="bd_emergencySurcharge" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.emergencySurcharge || 0} />
              </div>
              <div>
                <Label>Night Surcharge (₹)</Label>
                <Input name="bd_nightSurcharge" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.nightSurcharge || 0} />
              </div>
              <div>
                <Label>Weekend/Holiday Surcharge (₹)</Label>
                <Input name="bd_weekendSurcharge" type="number" min="0" defaultValue={editingOtProcedure?.billingDefaults?.weekendSurcharge || 0} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={editingOtProcedure?.description || ''} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowOtProcedureDialog(false)}>Cancel</Button>
              <Button type="submit">{editingOtProcedure ? 'Update' : 'Create'} Procedure</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Imaging Service Dialog */}
      <Dialog open={showImagingServiceDialog} onOpenChange={setShowImagingServiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingImagingService ? 'Edit Imaging Service' : 'Add Imaging Service'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const data: any = {
              name: fd.get('name'),
              description: fd.get('description'),
              basePrice: parseFloat(fd.get('basePrice') as string),
              duration: parseInt((fd.get('duration') as string) || '0') || 30,
              category: fd.get('category') || null,
              modality: fd.get('modality'),
              bodyPart: fd.get('bodyPart') || null,
              contrast: fd.get('contrast') === 'on',
              isActive: fd.get('isActive') === 'on',
            };
            handleImagingServiceSubmit(data);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input id="name" name="name" defaultValue={editingImagingService?.name} required />
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input id="basePrice" name="basePrice" type="number" step="0.01" min="0" defaultValue={editingImagingService?.basePrice} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min="1" defaultValue={editingImagingService?.duration || 30} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select id="category" name="category" defaultValue={editingImagingService?.category || ''} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">-- Select category --</option>
                  {imagingCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modality">Modality *</Label>
                <select id="modality" name="modality" defaultValue={editingImagingService?.modality || ''} required className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">-- Select modality --</option>
                  {imagingModalities.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bodyPart">Body Part</Label>
                <select id="bodyPart" name="bodyPart" defaultValue={editingImagingService?.bodyPart || ''} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">-- Select body part --</option>
                  {bodyParts.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="contrast" defaultChecked={editingImagingService?.contrast ?? false} className="w-4 h-4" />
                  <span className="text-sm">Contrast Required</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isActive" defaultChecked={editingImagingService?.isActive ?? true} className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={editingImagingService?.description || ''} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowImagingServiceDialog(false)}>Cancel</Button>
              <Button type="submit">{editingImagingService ? 'Update' : 'Create'} Service</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Imaging Procedure Dialog */}
      <Dialog open={showImagingProcedureDialog} onOpenChange={setShowImagingProcedureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingImagingProcedure ? 'Edit Imaging Procedure' : 'Add Imaging Procedure'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const bd: any = {
              radiologistFee: parseFloat((fd.get('bd_radiologistFee') as string) || '0') || 0,
              contrastSurcharge: parseFloat((fd.get('bd_contrastSurcharge') as string) || '0') || 0,
              portableSurcharge: parseFloat((fd.get('bd_portableSurcharge') as string) || '0') || 0,
              urgentSurcharge: parseFloat((fd.get('bd_urgentSurcharge') as string) || '0') || 0,
              filmCdCharge: parseFloat((fd.get('bd_filmCdCharge') as string) || '0') || 0,
              defaultContrastUsed: fd.get('bd_defaultContrastUsed') === 'on',
            };
            const data: any = {
              serviceId: fd.get('serviceId'),
              name: fd.get('name'),
              code: fd.get('code'),
              description: fd.get('description'),
              price: parseFloat(fd.get('price') as string),
              duration: parseInt((fd.get('duration') as string) || '0') || 30,
              preparation: fd.get('preparation') || null,
              contrastAgent: fd.get('contrastAgent') || null,
              billingDefaults: bd,
              isActive: fd.get('isActive') === 'on',
            };
            handleImagingProcedureSubmit(data);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceId">Service *</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  defaultValue={editingImagingProcedure?.serviceId || selectedService || ''}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Select service --</option>
                  {imagingServices.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.modality})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Procedure Name *</Label>
                <Input id="name" name="name" defaultValue={editingImagingProcedure?.name} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editingImagingProcedure?.price} required />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input id="duration" name="duration" type="number" min="1" defaultValue={editingImagingProcedure?.duration || 30} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" defaultValue={editingImagingProcedure?.code || ''} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isActive" defaultChecked={editingImagingProcedure?.isActive ?? true} className="w-4 h-4" />
                  <span className="text-sm">Active</span>
                </label>
              </div>
            </div>

            {/* Billing Defaults */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded p-3">
              <div>
                <Label>Radiologist Fee (₹)</Label>
                <Input name="bd_radiologistFee" type="number" min="0" defaultValue={editingImagingProcedure?.billingDefaults?.radiologistFee || 0} />
              </div>
              <div>
                <Label>Contrast Surcharge (₹)</Label>
                <Input name="bd_contrastSurcharge" type="number" min="0" defaultValue={editingImagingProcedure?.billingDefaults?.contrastSurcharge || 0} />
              </div>
              <div>
                <Label>Portable Surcharge (₹)</Label>
                <Input name="bd_portableSurcharge" type="number" min="0" defaultValue={editingImagingProcedure?.billingDefaults?.portableSurcharge || 0} />
              </div>
              <div>
                <Label>Urgent/STAT Surcharge (₹)</Label>
                <Input name="bd_urgentSurcharge" type="number" min="0" defaultValue={editingImagingProcedure?.billingDefaults?.urgentSurcharge || 0} />
              </div>
              <div>
                <Label>Film/CD Charge (₹)</Label>
                <Input name="bd_filmCdCharge" type="number" min="0" defaultValue={editingImagingProcedure?.billingDefaults?.filmCdCharge || 0} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="bd_defaultContrastUsed" defaultChecked={editingImagingProcedure?.billingDefaults?.defaultContrastUsed || false} className="w-4 h-4" />
                  <span className="text-sm">Default: Contrast used</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preparation">Preparation</Label>
                <Textarea id="preparation" name="preparation" rows={3} defaultValue={editingImagingProcedure?.preparation || ''} />
              </div>
              <div>
                <Label htmlFor="contrastAgent">Contrast Agent</Label>
                <Input id="contrastAgent" name="contrastAgent" defaultValue={editingImagingProcedure?.contrastAgent || ''} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} defaultValue={editingImagingProcedure?.description || ''} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowImagingProcedureDialog(false)}>Cancel</Button>
              <Button type="submit">{editingImagingProcedure ? 'Update' : 'Create'} Procedure</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
