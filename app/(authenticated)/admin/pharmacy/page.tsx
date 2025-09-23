"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import BottomSheet from "@/components/ui/bottom-sheet";
import {
  Package,
  Pill,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  IndianRupee,
  Users,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Truck,
  ClipboardList,
  Receipt,
  Archive,
  Scan,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import Breadcrumb from "@/components/navigation/breadcrumb";

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  manufacturer: string;
  strength: string;
  dosageForm: string;
  unitType: string;
  mrp: number;
  purchasePrice: number;
  marginPercentage: number;
  prescriptionRequired: boolean;
  isActive: boolean;
  category: { id: string; name: string };
  gstSlab: { id: string; rate: number; name: string; description: string };
  totalStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  nearestExpiry: string | null;
}

interface StockItem {
  id: string;
  batchNumber: string;
  availableQuantity: number;
  purchasePrice: number;
  mrp: number;
  expiryDate: string;
  status: string;
  alerts: string[];
  daysUntilExpiry: number;
  medicine: {
    id: string;
    brand: string;
    genericName: string;
    manufacturer: string;
    dosageForm: string;
    strength: string;
  };
  supplier: {
    id: string;
    name: string;
  };
}

export default function PharmacyAdminPage() {
  const { data: session } = useSession();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState<string>(isMobile ? "medicines" : "dashboard");
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [search, setSearch] = useState("");
  const [medicineActionsOpen, setMedicineActionsOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [stockActionsOpen, setStockActionsOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const colorByTab: Record<string, string> = {
    dashboard: "text-sky-600",
    pos: "text-rose-600",
    medicines: "text-green-600",
    stock: "text-emerald-600",
    purchase: "text-indigo-600",
    reports: "text-violet-600",
    categories: "text-teal-600",
    gst: "text-gray-700",
  };

  const TABS_META: { key: string; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "pos", label: "Counter Sale", icon: CreditCard },
    { key: "medicines", label: "Medicines", icon: Pill },
    { key: "stock", label: "Stock", icon: Package },
    { key: "purchase", label: "Purchase", icon: Truck },
    { key: "reports", label: "Reports", icon: ClipboardList },
    { key: "categories", label: "Categories", icon: FileText },
    { key: "gst", label: "GST Config", icon: IndianRupee },
  ];

  const centerActiveTab = () => {
    const container = tabsContainerRef.current;
    const el = tabRefs.current[activeTab];
    if (!container || !el) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const delta = (eRect.left + eRect.width / 2) - (cRect.left + cRect.width / 2);
    container.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    // Next frame to ensure layout is measured
    const id = requestAnimationFrame(centerActiveTab);
    return () => cancelAnimationFrame(id);
  }, [activeTab]);

  useEffect(() => {
    const onResize = () => centerActiveTab();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [medicinesPagination, setMedicinesPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [stockPagination, setStockPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  // Stock filters
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "expiring" | "expired">("all");
  const [medicineFilter, setMedicineFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [suppliers, setSuppliers] = useState<Array<{id: string; name: string}>>([]);
  
  // Medicine CRUD state
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [gstSlabs, setGstSlabs] = useState<any[]>([]);
  const [medicineFormData, setMedicineFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    manufacturer: '',
    strength: '',
    dosageForm: '',
    unitType: '',
    categoryId: '',
    gstSlabId: '',
    mrp: '',
    purchasePrice: '',
    prescriptionRequired: true,
    isActive: true,
    description: '',
  });
  
  // Category CRUD state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    gstRate: '5.0',
    isActive: true,
  });
  
  // GST Slab CRUD state
  const [showGstDialog, setShowGstDialog] = useState(false);
  const [editingGst, setEditingGst] = useState<any>(null);
  const [gstFormData, setGstFormData] = useState({
    name: '',
    rate: '',
    description: '',
    isActive: true,
  });
  const [dashboardStats, setDashboardStats] = useState({
    totalMedicines: 0,
    totalStock: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0,
    categories: 0,
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const [medicinesRes, stockRes] = await Promise.all([
        fetch("/api/pharmacy/medicines?limit=1000"),
        fetch("/api/pharmacy/stock?limit=1000"),
      ]);

      if (medicinesRes.ok && stockRes.ok) {
        const medicinesData = await medicinesRes.json();
        const stockData = await stockRes.json();

        const totalStock = stockData.stocks.reduce(
          (sum: number, item: StockItem) => sum + item.availableQuantity,
          0
        );

        const totalValue = stockData.stocks.reduce(
          (sum: number, item: StockItem) => {
            // Use purchasePrice * availableQuantity for stock value calculation
            const stockValue = item.availableQuantity * (item.purchasePrice || 0);
            return sum + stockValue;
          },
          0
        );

        const lowStockItems = stockData.stocks.filter(
          (item: StockItem) => item.alerts.includes('LOW_STOCK')
        ).length;

        const expiringSoon = stockData.stocks.filter(
          (item: StockItem) => item.alerts.includes('EXPIRING_SOON')
        ).length;

        // Get total active categories from API
        const categoriesRes = await fetch('/api/pharmacy/categories');
        let categories = 0;
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          categories = categoriesData.categories?.filter((cat: any) => cat.isActive).length || 
                     new Set(medicinesData.medicines.map((med: Medicine) => med.category.id)).size;
        } else {
          categories = new Set(medicinesData.medicines.map((med: Medicine) => med.category.id)).size;
        }

        setDashboardStats({
          totalMedicines: medicinesData.medicines.length,
          totalStock,
          lowStockItems,
          expiringSoon,
          totalValue,
          categories,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  // Fetch medicines
  const fetchMedicines = async (page = medicinesPagination.page) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/pharmacy/medicines?search=${encodeURIComponent(search)}&page=${page}&limit=${medicinesPagination.limit}`
      );
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines);
        setMedicinesPagination(data.pagination);
      } else {
        toast.error("Failed to fetch medicines");
      }
    } catch (error) {
      toast.error("Error fetching medicines");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock items
  const fetchStocks = async (page = stockPagination.page) => {
    try {
      setLoading(true);
      const statusParams = stockFilter === 'low' 
        ? '&lowStock=true' 
        : stockFilter === 'expiring' 
        ? '&nearExpiry=true' 
        : stockFilter === 'expired' 
        ? '&expired=true' 
        : '';
      const medicineParam = medicineFilter ? `&medicineId=${medicineFilter}` : '';
      const supplierParam = supplierFilter ? `&supplierId=${supplierFilter}` : '';
      const res = await fetch(`/api/pharmacy/stock?search=${encodeURIComponent(search)}&page=${page}&limit=${stockPagination.limit}${statusParams}${medicineParam}${supplierParam}`);
      if (res.ok) {
        const data = await res.json();
        setStocks(data.stocks);
        setStockPagination(data.pagination);
      } else {
        toast.error("Failed to fetch stock");
      }
    } catch (error) {
      toast.error("Error fetching stock");
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handleMedicinesPageChange = (newPage: number) => {
    setMedicinesPagination(prev => ({ ...prev, page: newPage }));
    fetchMedicines(newPage);
  };

  const handleStockPageChange = (newPage: number) => {
    setStockPagination(prev => ({ ...prev, page: newPage }));
    fetchStocks(newPage);
  };

  // Pagination component
  const PaginationControls = ({ 
    pagination, 
    onPageChange,
    onLimitChange,
    className = "" 
  }: { 
    pagination: typeof medicinesPagination;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    className?: string;
  }) => {
    return (
      <div className={`flex items-center justify-between px-4 py-3 ${className}`}>
        <div className="flex items-center space-x-4 text-sm text-gray-700">
          <span>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
            {pagination.totalCount} results
          </span>
          <div className="flex items-center space-x-2">
            <span>Show:</span>
            <Select 
              value={pagination.limit.toString()} 
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        </div>
        {pagination.totalPages > 1 ? (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = pagination.page <= 3 
                ? i + 1 
                : pagination.page > pagination.totalPages - 2
                ? pagination.totalPages - 4 + i
                : pagination.page - 2 + i;
              
              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  };

  // Handle limit change
  const handleMedicinesLimitChange = (limit: number) => {
    setMedicinesPagination(prev => ({ ...prev, limit, page: 1 }));
    fetchMedicines(1);
  };

  const handleStockLimitChange = (limit: number) => {
    setStockPagination(prev => ({ ...prev, limit, page: 1 }));
    fetchStocks(1);
  };

  // Fetch categories and GST slabs for forms
  const fetchFormData = async () => {
    try {
      const [categoriesRes, gstRes, suppliersRes] = await Promise.all([
        fetch('/api/pharmacy/categories'),
        fetch('/api/pharmacy/gst-slabs'),
        fetch('/api/pharmacy/suppliers')
      ]);
      
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
      
      if (gstRes.ok) {
        const gstData = await gstRes.json();
        setGstSlabs(gstData.slabs || []);
      }
      
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  // Medicine CRUD functions
  const openMedicineDialog = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setMedicineFormData({
        name: medicine.name,
        genericName: medicine.genericName,
        brand: medicine.brand,
        manufacturer: medicine.manufacturer,
        strength: medicine.strength,
        dosageForm: medicine.dosageForm,
        unitType: medicine.unitType,
        categoryId: medicine.category.id,
        gstSlabId: medicine.gstSlab.id,
        mrp: medicine.mrp.toString(),
        purchasePrice: medicine.purchasePrice.toString(),
        prescriptionRequired: medicine.prescriptionRequired,
        isActive: medicine.isActive,
        description: (medicine as any).description || '',
      });
    } else {
      setEditingMedicine(null);
      setMedicineFormData({
        name: '',
        genericName: '',
        brand: '',
        manufacturer: '',
        strength: '',
        dosageForm: '',
        unitType: '',
        categoryId: '',
        gstSlabId: '',
        mrp: '',
        purchasePrice: '',
        prescriptionRequired: true,
        isActive: true,
        description: '',
      });
    }
    setShowMedicineDialog(true);
  };

  const handleMedicineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMedicine ? 'PUT' : 'POST';
      const url = '/api/pharmacy/medicines';
      const data = {
        ...medicineFormData,
        ...(editingMedicine && { id: editingMedicine.id }),
        mrp: parseFloat(medicineFormData.mrp),
        purchasePrice: parseFloat(medicineFormData.purchasePrice),
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        toast.success(editingMedicine ? 'Medicine updated successfully' : 'Medicine created successfully');
        setShowMedicineDialog(false);
        fetchMedicines(medicinesPagination.page);
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save medicine');
      }
    } catch (error) {
      toast.error('Error saving medicine');
    }
  };

  const handleMedicineDelete = async (medicine: Medicine) => {
    if (!confirm(`Are you sure you want to delete ${medicine.brand}?`)) return;
    
    try {
      const res = await fetch('/api/pharmacy/medicines', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: medicine.id }),
      });
      
      if (res.ok) {
        toast.success('Medicine deleted successfully');
        fetchMedicines(medicinesPagination.page);
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete medicine');
      }
    } catch (error) {
      toast.error('Error deleting medicine');
    }
  };

  // Category CRUD functions
  const openCategoryDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || '',
        gstRate: category.gstRate?.toString() || '5.0',
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        gstRate: '5.0',
        isActive: true,
      });
    }
    setShowCategoryDialog(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const data = {
        ...categoryFormData,
        ...(editingCategory && { id: editingCategory.id }),
        gstRate: parseFloat(categoryFormData.gstRate),
      };
      
      const res = await fetch('/api/pharmacy/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
        setShowCategoryDialog(false);
        fetchFormData();
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save category');
      }
    } catch (error) {
      toast.error('Error saving category');
    }
  };

  const handleCategoryDelete = async (category: any) => {
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) return;
    
    try {
      const res = await fetch('/api/pharmacy/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id }),
      });
      
      if (res.ok) {
        toast.success('Category deleted successfully');
        fetchFormData();
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  // GST Slab CRUD functions
  const openGstDialog = (slab?: any) => {
    if (slab) {
      setEditingGst(slab);
      setGstFormData({
        name: slab.name,
        rate: slab.rate?.toString() || '',
        description: slab.description || '',
        isActive: slab.isActive,
      });
    } else {
      setEditingGst(null);
      setGstFormData({
        name: '',
        rate: '',
        description: '',
        isActive: true,
      });
    }
    setShowGstDialog(true);
  };

  const handleGstSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingGst ? 'PUT' : 'POST';
      const data = {
        ...gstFormData,
        ...(editingGst && { id: editingGst.id }),
        rate: parseFloat(gstFormData.rate),
      };
      
      const res = await fetch('/api/pharmacy/gst-slabs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (res.ok) {
        toast.success(editingGst ? 'GST slab updated successfully' : 'GST slab created successfully');
        setShowGstDialog(false);
        fetchFormData();
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save GST slab');
      }
    } catch (error) {
      toast.error('Error saving GST slab');
    }
  };

  const handleGstDelete = async (slab: any) => {
    if (!confirm(`Are you sure you want to delete ${slab.name}?`)) return;
    
    try {
      const res = await fetch('/api/pharmacy/gst-slabs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slab.id }),
      });
      
      if (res.ok) {
        toast.success('GST slab deleted successfully');
        fetchFormData();
        fetchDashboardStats();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete GST slab');
      }
    } catch (error) {
      toast.error('Error deleting GST slab');
    }
  };

  useEffect(() => {
      if (session?.user) {
      fetchDashboardStats();
      fetchFormData();
      if (activeTab === "medicines") {
        // Reset to first page when search changes
        if (search !== "") {
          setMedicinesPagination(prev => ({ ...prev, page: 1 }));
        }
        fetchMedicines(1);
      } else if (activeTab === "stock") {
        // Reset to first page when search or filter changes  
        setStockPagination(prev => ({ ...prev, page: 1 }));
        fetchStocks(1);
      }
    }
  }, [session, activeTab, search, stockFilter, medicineFilter, supplierFilter]);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800 border-green-200";
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800 border-red-200";
      case "NEAR_EXPIRY":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
          <p className="text-gray-600">You don't have permission to access the pharmacy module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-0 md:space-y-6 overflow-x-hidden">
      <div className="hidden md:block">
        <Breadcrumb 
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Pharmacy", href: "/admin/pharmacy" }
          ]} 
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Pill className="w-8 h-8 mr-3 text-green-600" />
            Pharmacy Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage medicine database, pricing, GST, and inventory
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom tab nav styled like Doctor Console, scrollable and colored icons */}
        <div ref={tabsContainerRef} className="w-full overflow-x-auto whitespace-nowrap no-scrollbar">
          <nav className="-mb-px flex items-center space-x-4 border-b border-gray-200 px-1">
            {TABS_META.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              const color = colorByTab[t.key] || "text-gray-700";
              const display = t.key === "medicines"
                ? `${t.label} (${dashboardStats.totalMedicines})`
                : t.key === "stock"
                ? `${t.label} (${dashboardStats.totalStock.toLocaleString()})`
                : t.label;
              return (
                <button
                  key={t.key}
                  ref={(el) => { tabRefs.current[t.key] = el; }}
                  onClick={() => setActiveTab(t.key)}
                  className={`shrink-0 py-2 px-2 border-b-2 text-sm font-medium transition-colors scroll-ml-3 ${
                    active
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="inline-flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${active ? "text-blue-600" : color}`} />
                    {display}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Medicines</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardStats.totalMedicines}
                    </p>
                  </div>
                  <Pill className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardStats.totalStock.toLocaleString()}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardStats.totalValue)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {dashboardStats.lowStockItems}
                      </p>
                    </div>
                    <Package className="w-6 h-6 text-yellow-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                      <p className="text-xl font-bold text-orange-600">
                        {dashboardStats.expiringSoon}
                      </p>
                    </div>
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Categories</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardStats.categories}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Counter Sale/POS Tab */}
        <TabsContent value="pos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search & Barcode Scanner */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="w-5 h-5 mr-2" />
                    Product Search & Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search medicine or scan barcode..."
                        className="pl-9"
                      />
                    </div>
                    <Button variant="outline">
                      <Scan className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                  
                  {/* Quick Selection Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {medicines.slice(0, 6).map((medicine) => (
                      <Card key={medicine.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="text-sm">
                          <p className="font-semibold truncate">{medicine.brand}</p>
                          <p className="text-gray-600 text-xs">{medicine.genericName}</p>
                          <p className="text-green-600 font-semibold">{formatCurrency(medicine.mrp)}</p>
                          <Badge 
                            className={`text-xs ${
                              medicine.stockStatus === 'IN_STOCK' 
                                ? 'bg-green-100 text-green-800' 
                                : medicine.stockStatus === 'LOW_STOCK'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Stock: {medicine.totalStock}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bill/Cart */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Receipt className="w-5 h-5 mr-2" />
                      Current Bill
                    </span>
                    <Button size="sm" variant="outline">
                      Clear
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="space-y-2">
                    <Label>Customer Details</Label>
                    <Input placeholder="Customer Name (Optional)" />
                    <Input placeholder="Phone Number" />
                  </div>

                  {/* Bill Items */}
                  <div className="space-y-2">
                    <Label>Items (0)</Label>
                    <div className="text-sm text-gray-500 text-center py-8">
                      No items added yet
                    </div>
                  </div>

                  {/* Bill Summary */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST:</span>
                      <span>₹0.00</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>₹0.00</span>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select defaultValue="cash">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Process Payment
                    </Button>
                    <Button variant="outline" className="w-full">
                      Hold Bill
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sales Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 text-center py-8">
                No sales recorded today
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medicines Tab */}
        <TabsContent value="medicines" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
            <Button onClick={() => openMedicineDialog()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading medicines...</p>
                </div>
              ) : medicines.length === 0 ? (
                <div className="p-8 text-center">
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No medicines found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {medicines.map((medicine) => (
                    <div key={medicine.id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {medicine.brand}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {medicine.genericName} • {medicine.strength} • {medicine.dosageForm}
                              </p>
                              <p className="text-xs text-gray-500">
                                {medicine.manufacturer} • {medicine.category.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center sm:space-x-4">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(medicine.purchasePrice)}
                            </p>
                            <p className="text-xs text-blue-600">
                              Cost Price
                            </p>
                            <p className="text-xs text-gray-500">
                              MRP: {formatCurrency(medicine.mrp)}
                            </p>
                            <p className="text-xs text-green-600">
                              {medicine.marginPercentage.toFixed(1)}% margin
                            </p>
                          </div>

                          <div className="text-left sm:text-center">
                            <p className="font-semibold text-gray-900">
                              {medicine.totalStock}
                            </p>
                            <Badge className={getStockStatusColor(medicine.stockStatus)}>
                              {medicine.stockStatus.replace("_", " ")}
                            </Badge>
                          </div>

                          <div className="text-left sm:text-center">
                            <Badge variant="outline">
                              GST {medicine.gstSlab.rate}%
                            </Badge>
                          </div>

                          <div className="hidden sm:flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openMedicineDialog(medicine)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleMedicineDelete(medicine)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="sm:hidden">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedMedicine(medicine); setMedicineActionsOpen(true); }} aria-label="Actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && (
                <PaginationControls 
                  pagination={medicinesPagination}
                  onPageChange={handleMedicinesPageChange}
                  onLimitChange={handleMedicinesLimitChange}
                  className="border-t"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search stock..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={medicineFilter} onValueChange={setMedicineFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by medicine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Medicines</SelectItem>
                  {medicines.slice(0, 50).map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.brand} ({medicine.genericName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as typeof stockFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              
              {(medicineFilter || supplierFilter || stockFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setMedicineFilter('');
                    setSupplierFilter('');
                    setStockFilter('all');
                  }}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading stock...</p>
                </div>
              ) : stocks.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No stock found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {stocks.map((stock) => (
                    <div key={stock.id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {stock.medicine.brand}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {stock.medicine.genericName} • {stock.medicine.strength} • {stock.medicine.dosageForm}
                              </p>
                              <p className="text-xs text-gray-500">
                                Batch: {stock.batchNumber} • Supplier: {stock.supplier.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:items-center sm:space-x-4">
                          <div className="text-left sm:text-center">
                            <p className="font-semibold text-gray-900">
                              {stock.availableQuantity}
                            </p>
                            <p className="text-xs text-gray-500">Available</p>
                          </div>

                          <div className="text-left sm:text-center">
                            <p className="font-semibold text-gray-900">
                              {stock.daysUntilExpiry} days
                            </p>
                            <p className="text-xs text-gray-500">Until expiry</p>
                          </div>

                          <div className="text-left sm:text-center">
                            <Badge className={getStockStatusColor(stock.status)}>
                              {stock.status.replace("_", " ")}
                            </Badge>
                            {stock.alerts.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {stock.alerts.map((alert, index) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {alert.replace("_", " ")}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="hidden sm:flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="sm:hidden">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedStock(stock); setStockActionsOpen(true); }} aria-label="Actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && (
                <PaginationControls 
                  pagination={stockPagination}
                  onPageChange={handleStockPageChange}
                  onLimitChange={handleStockLimitChange}
                  className="border-t"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Management Tab */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Purchase Management</h2>
              <p className="text-gray-600">Manage suppliers, purchase orders, and stock receipts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => {}} className="w-full sm:w-auto whitespace-normal text-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Purchase Order
              </Button>
              <Button variant="outline" onClick={() => {}} className="w-full sm:w-auto whitespace-normal text-sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Suppliers
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">0</div>
                <p className="text-sm text-gray-600">Orders awaiting delivery</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">₹0</div>
                <p className="text-sm text-gray-600">Total purchases</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">29</div>
                <p className="text-sm text-gray-600">Verified suppliers</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 text-center py-8">
                No purchase orders found. Create your first purchase order to get started.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports & Analytics Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Reports & Analytics</h2>
              <p className="text-gray-600">Business insights, sales reports, and inventory analytics</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                Date Range
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹0</div>
                <p className="text-xs text-gray-600">0 transactions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">₹0</div>
                <p className="text-xs text-gray-600">Monthly revenue</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dashboardStats.expiringSoon}</div>
                <p className="text-xs text-gray-600">Items in 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dashboardStats.lowStockItems}</div>
                <p className="text-xs text-gray-600">Items need reorder</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Medicines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 text-center py-8">
                  No sales data available yet
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Movement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 text-center py-8">
                  No stock movement data available
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <FileText className="w-6 h-6" />
                  <span>Sales Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Package className="w-6 h-6" />
                  <span>Stock Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <AlertTriangle className="w-6 h-6" />
                  <span>Expiry Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <IndianRupee className="w-6 h-6" />
                  <span>GST Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Truck className="w-6 h-6" />
                  <span>Purchase Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Users className="w-6 h-6" />
                  <span>Supplier Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Medicine Categories</h2>
              <p className="text-gray-600">Manage medicine categories and their default GST rates</p>
            </div>
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">GST {category.gstRate}%</Badge>
                          <span className="text-xs text-gray-500">
                            {category._count?.medicines || 0} medicines
                          </span>
                          <Badge 
                            className={category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openCategoryDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleCategoryDelete(category)}
                          disabled={category._count?.medicines > 0}
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
        </TabsContent>

        {/* GST Config Tab */}
        <TabsContent value="gst" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">GST Slab Configuration</h2>
              <p className="text-gray-600">Manage GST slabs for different medicine categories</p>
            </div>
            <Button onClick={() => openGstDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add GST Slab
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {gstSlabs.map((slab) => (
                  <div key={slab.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{slab.name}</h3>
                        <p className="text-sm text-gray-600">{slab.description || 'No description'}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline" className="font-semibold">
                            {slab.rate}% GST
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {slab._count?.medicines || 0} medicines
                          </span>
                          <Badge 
                            className={slab.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {slab.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openGstDialog(slab)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleGstDelete(slab)}
                          disabled={slab._count?.medicines > 0}
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
        </TabsContent>

        {/* Mobile action sheet for Medicines */}
        <BottomSheet isOpen={medicineActionsOpen} onClose={() => setMedicineActionsOpen(false)} title="Medicine Actions">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => { setMedicineActionsOpen(false); if (selectedMedicine) openMedicineDialog(selectedMedicine); }}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
            <Button variant="outline" onClick={() => { setMedicineActionsOpen(false); if (selectedMedicine) handleMedicineDelete(selectedMedicine); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </div>
        </BottomSheet>

        {/* Mobile action sheet for Stock */}
        <BottomSheet isOpen={stockActionsOpen} onClose={() => setStockActionsOpen(false)} title="Stock Actions">
          <div className="grid grid-cols-1 gap-3">
            <Button onClick={() => { setStockActionsOpen(false); /* implement stock edit when available */ }}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          </div>
        </BottomSheet>
      </Tabs>

      {/* Medicine Form Dialog */}
      <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleMedicineSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  value={medicineFormData.name}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name *</Label>
                <Input
                  id="genericName"
                  value={medicineFormData.genericName}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, genericName: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand Name *</Label>
                <Input
                  id="brand"
                  value={medicineFormData.brand}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, brand: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={medicineFormData.manufacturer}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strength">Strength *</Label>
                <Input
                  id="strength"
                  placeholder="e.g., 500mg, 10ml"
                  value={medicineFormData.strength}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, strength: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosageForm">Dosage Form *</Label>
                <Select
                  value={medicineFormData.dosageForm}
                  onValueChange={(value) => setMedicineFormData(prev => ({ ...prev, dosageForm: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dosage form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Drops">Drops</SelectItem>
                    <SelectItem value="Ointment">Ointment</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                    <SelectItem value="Powder">Powder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitType">Unit Type *</Label>
                <Input
                  id="unitType"
                  placeholder="e.g., Strip of 10, Bottle 100ml"
                  value={medicineFormData.unitType}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, unitType: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category *</Label>
                <Select
                  value={medicineFormData.categoryId}
                  onValueChange={(value) => setMedicineFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP *</Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  value={medicineFormData.mrp}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, mrp: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={medicineFormData.purchasePrice}
                  onChange={(e) => setMedicineFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstSlabId">GST Slab *</Label>
              <Select
                value={medicineFormData.gstSlabId}
                onValueChange={(value) => setMedicineFormData(prev => ({ ...prev, gstSlabId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GST slab" />
                </SelectTrigger>
                <SelectContent>
                  {gstSlabs.map((slab) => (
                    <SelectItem key={slab.id} value={slab.id}>
                      {slab.name} - {slab.rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={medicineFormData.description}
                onChange={(e) => setMedicineFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prescriptionRequired"
                  checked={medicineFormData.prescriptionRequired}
                  onCheckedChange={(checked) => setMedicineFormData(prev => ({ ...prev, prescriptionRequired: !!checked }))}
                />
                <Label htmlFor="prescriptionRequired">Prescription Required</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={medicineFormData.isActive}
                  onCheckedChange={(checked) => setMedicineFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMedicineDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingMedicine ? 'Update Medicine' : 'Create Medicine'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Form Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstRate">Default GST Rate (%)</Label>
              <Input
                id="gstRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={categoryFormData.gstRate}
                onChange={(e) => setCategoryFormData(prev => ({ ...prev, gstRate: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="categoryActive"
                checked={categoryFormData.isActive}
                onCheckedChange={(checked) => setCategoryFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="categoryActive">Active</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* GST Slab Form Dialog */}
      <Dialog open={showGstDialog} onOpenChange={setShowGstDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGst ? 'Edit GST Slab' : 'Add New GST Slab'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleGstSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gstName">GST Slab Name *</Label>
              <Input
                id="gstName"
                placeholder="e.g., 5% GST, 12% GST"
                value={gstFormData.name}
                onChange={(e) => setGstFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstRate">GST Rate (%) *</Label>
              <Input
                id="gstRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={gstFormData.rate}
                onChange={(e) => setGstFormData(prev => ({ ...prev, rate: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstDescription">Description</Label>
              <Textarea
                id="gstDescription"
                placeholder="e.g., Essential medicines, Luxury items"
                value={gstFormData.description}
                onChange={(e) => setGstFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gstActive"
                checked={gstFormData.isActive}
                onCheckedChange={(checked) => setGstFormData(prev => ({ ...prev, isActive: !!checked }))}
              />
              <Label htmlFor="gstActive">Active</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowGstDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingGst ? 'Update GST Slab' : 'Create GST Slab'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
