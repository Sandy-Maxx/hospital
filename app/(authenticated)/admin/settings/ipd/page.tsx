"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bed, Plus, Edit, Trash2, Save, X, 
  Building2, Settings, Users, IndianRupee
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

interface BedType {
  id: string;
  name: string;
  description: string;
  dailyRate: number;
  amenities: string[];
  maxOccupancy: number;
  isActive: boolean;
}

interface Ward {
  id: string;
  name: string;
  description: string;
  floor: string;
  department: string;
  capacity: number;
  bedTypes: BedType[];
  statistics: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  };
  isActive: boolean;
}

const STANDARD_AMENITIES = [
  "Basic Bed", "Mattress", "Pillow", "Blanket", "Side Table",
  "Reading Light", "TV", "AC", "Ceiling Fan", "Attached Bathroom",
  "Private Bathroom", "WiFi", "Mini Fridge", "Wardrobe", "Sofa",
  "Attendant Bed", "ICU Bed", "Ventilator", "Cardiac Monitor",
  "IV Stands", "Oxygen Supply", "Defibrillator", "Baby Cot"
];

const DEPARTMENTS = [
  "General Medicine", "Critical Care", "Pediatrics", "Obstetrics & Gynecology",
  "Cardiology", "Orthopedics", "Neurology", "Gastroenterology", "Oncology",
  "Emergency", "Surgery", "Psychiatry"
];

export default function IPDSettingsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [isBedTypeDialogOpen, setIsBedTypeDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingBedType, setEditingBedType] = useState<{ bedType: BedType; wardId: string } | null>(null);
  const [selectedWardForBedType, setSelectedWardForBedType] = useState<string>("");

  // Ward form state
  const [wardForm, setWardForm] = useState({
    name: "",
    description: "",
    floor: "",
    department: "",
    capacity: 10
  });

  // Bed type form state
  const [bedTypeForm, setBedTypeForm] = useState({
    name: "",
    description: "",
    dailyRate: 1000,
    maxOccupancy: 1,
    amenities: [] as string[]
  });

  const fetchWards = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ipd/wards");
      const data = await response.json();
      if (response.ok) {
        setWards(data.wards);
      }
    } catch (error) {
      console.error("Error fetching wards:", error);
      toast.error("Failed to fetch wards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWards();
  }, []);

  const handleCreateWard = async () => {
    try {
      const response = await fetch("/api/ipd/wards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wardForm)
      });

      if (response.ok) {
        toast.success("Ward created successfully");
        setIsWardDialogOpen(false);
        setWardForm({ name: "", description: "", floor: "", department: "", capacity: 10 });
        fetchWards();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create ward");
      }
    } catch (error) {
      toast.error("Failed to create ward");
    }
  };

  const handleCreateBedType = async () => {
    try {
      const response = await fetch("/api/ipd/bed-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bedTypeForm,
          wardId: selectedWardForBedType
        })
      });

      if (response.ok) {
        toast.success("Bed type created successfully");
        setIsBedTypeDialogOpen(false);
        setBedTypeForm({ name: "", description: "", dailyRate: 1000, maxOccupancy: 1, amenities: [] });
        setSelectedWardForBedType("");
        fetchWards();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create bed type");
      }
    } catch (error) {
      toast.error("Failed to create bed type");
    }
  };

  const toggleAmenity = (amenity: string) => {
    setBedTypeForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const resetWardForm = () => {
    setWardForm({ name: "", description: "", floor: "", department: "", capacity: 10 });
    setEditingWard(null);
  };

  const resetBedTypeForm = () => {
    setBedTypeForm({ name: "", description: "", dailyRate: 1000, maxOccupancy: 1, amenities: [] });
    setEditingBedType(null);
    setSelectedWardForBedType("");
  };

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
          <h1 className="text-3xl font-bold text-gray-900">IPD Settings</h1>
          <p className="text-gray-600 mt-1">Configure wards, bed types, and IPD management settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isWardDialogOpen} onOpenChange={setIsWardDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetWardForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ward
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Ward</DialogTitle>
                <DialogDescription>
                  Create a new ward for patient accommodation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wardName">Ward Name *</Label>
                  <Input
                    id="wardName"
                    value={wardForm.name}
                    onChange={(e) => setWardForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., General Ward, ICU, Private Ward"
                  />
                </div>
                <div>
                  <Label htmlFor="wardDescription">Description</Label>
                  <Textarea
                    id="wardDescription"
                    value={wardForm.description}
                    onChange={(e) => setWardForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the ward"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      value={wardForm.floor}
                      onChange={(e) => setWardForm(prev => ({ ...prev, floor: e.target.value }))}
                      placeholder="e.g., Ground Floor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="100"
                      value={wardForm.capacity}
                      onChange={(e) => setWardForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={wardForm.department} 
                    onValueChange={(value) => setWardForm(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsWardDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWard} disabled={!wardForm.name || wardForm.capacity < 1}>
                    Create Ward
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="wards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wards">Wards Management</TabsTrigger>
          <TabsTrigger value="bed-types">Bed Types</TabsTrigger>
        </TabsList>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wards.map((ward) => (
              <Card key={ward.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ward.name}</CardTitle>
                    <Badge variant="outline">{ward.floor}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{ward.department}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700">{ward.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Capacity:</span>
                        <p className="text-lg font-bold text-blue-600">{ward.capacity}</p>
                      </div>
                      <div>
                        <span className="font-medium">Occupancy:</span>
                        <p className="text-lg font-bold text-purple-600">{ward.statistics.occupancyRate}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Bed Types:</h4>
                      <div className="space-y-1">
                        {ward.bedTypes.map((bedType) => (
                          <div key={bedType.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                            <span>{bedType.name}</span>
                            <span className="font-medium">₹{bedType.dailyRate}/day</span>
                          </div>
                        ))}
                      </div>
                      {ward.bedTypes.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No bed types configured</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Dialog open={isBedTypeDialogOpen && selectedWardForBedType === ward.id} 
                             onOpenChange={(open) => {
                               setIsBedTypeDialogOpen(open);
                               if (open) setSelectedWardForBedType(ward.id);
                               else resetBedTypeForm();
                             }}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="flex-1">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Bed Type
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Bed Type to {ward.name}</DialogTitle>
                            <DialogDescription>
                              Configure a new bed type for this ward
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="bedTypeName">Bed Type Name *</Label>
                              <Input
                                id="bedTypeName"
                                value={bedTypeForm.name}
                                onChange={(e) => setBedTypeForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., General, Private, ICU, Deluxe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bedTypeDescription">Description</Label>
                              <Textarea
                                id="bedTypeDescription"
                                value={bedTypeForm.description}
                                onChange={(e) => setBedTypeForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description of bed type and facilities"
                                className="h-20"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="dailyRate">Daily Rate (₹) *</Label>
                                <Input
                                  id="dailyRate"
                                  type="number"
                                  min="0"
                                  value={bedTypeForm.dailyRate}
                                  onChange={(e) => setBedTypeForm(prev => ({ 
                                    ...prev, 
                                    dailyRate: parseFloat(e.target.value) || 0 
                                  }))}
                                />
                              </div>
                              <div>
                                <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                                <Select 
                                  value={bedTypeForm.maxOccupancy.toString()} 
                                  onValueChange={(value) => setBedTypeForm(prev => ({ 
                                    ...prev, 
                                    maxOccupancy: parseInt(value) 
                                  }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 Person</SelectItem>
                                    <SelectItem value="2">2 Persons</SelectItem>
                                    <SelectItem value="3">3 Persons</SelectItem>
                                    <SelectItem value="4">4 Persons</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Amenities & Facilities</Label>
                              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                                {STANDARD_AMENITIES.map((amenity) => (
                                  <div key={amenity} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={amenity}
                                      checked={bedTypeForm.amenities.includes(amenity)}
                                      onChange={() => toggleAmenity(amenity)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={amenity} className="text-sm">{amenity}</label>
                                  </div>
                                ))}
                              </div>
                              {bedTypeForm.amenities.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600">Selected amenities:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {bedTypeForm.amenities.map((amenity) => (
                                      <Badge key={amenity} variant="secondary" className="text-xs">
                                        {amenity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setIsBedTypeDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleCreateBedType} disabled={!bedTypeForm.name || bedTypeForm.dailyRate <= 0}>
                                Create Bed Type
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {wards.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No wards configured yet</p>
              <p className="text-sm text-gray-500">Create your first ward to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bed-types" className="space-y-4">
          <div className="space-y-6">
            {wards.map((ward) => (
              <Card key={ward.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{ward.name} - Bed Types</span>
                    <Badge variant="outline">{ward.bedTypes.length} types</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ward.bedTypes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ward.bedTypes.map((bedType) => (
                        <div key={bedType.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{bedType.name}</h4>
                            <Badge className="bg-green-100 text-green-800">₹{bedType.dailyRate}/day</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{bedType.description}</p>
                          <div className="text-xs text-gray-500">
                            <p>Max Occupancy: {bedType.maxOccupancy} person(s)</p>
                            <p>Amenities: {bedType.amenities.length} items</p>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bed className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No bed types configured for this ward</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
