"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bed, Users, Activity, AlertCircle, CheckCircle,
  Settings, Plus, Search, RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BedType {
  id: string;
  name: string;
  description: string;
  dailyRate: number;
  amenities: string[];
  maxOccupancy: number;
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
    maintenanceBeds: number;
    blockedBeds: number;
    occupancyRate: number;
  };
}

interface BedInfo {
  id: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "BLOCKED";
  notes: string | null;
  ward: {
    id: string;
    name: string;
    floor: string;
    department: string;
  };
  bedType: BedType;
  currentAdmission: {
    id: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      gender: string;
    };
    admittedByUser: {
      id: string;
      name: string;
      role: string;
    };
  } | null;
  isOccupied: boolean;
}

export default function IPDPage() {
  const { data: session } = useSession();
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalBeds: 0,
    occupiedBeds: 0,
    availableBeds: 0,
    maintenanceBeds: 0,
    blockedBeds: 0,
    occupancyRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchIPDData = async () => {
    setLoading(true);
    try {
      // Fetch wards
      const wardsResponse = await fetch("/api/ipd/wards");
      const wardsData = await wardsResponse.json();
      
      if (wardsResponse.ok) {
        setWards(wardsData.wards);
        setOverallStats(wardsData.overallStats);
      }

      // Fetch beds
      const bedsResponse = await fetch("/api/ipd/beds");
      const bedsData = await bedsResponse.json();
      
      if (bedsResponse.ok) {
        setBeds(bedsData.beds);
      }
    } catch (error) {
      console.error("Error fetching IPD data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPDData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800 border-green-200";
      case "OCCUPIED":
        return "bg-red-100 text-red-800 border-red-200";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "BLOCKED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4" />;
      case "OCCUPIED":
        return <Users className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4" />;
      case "BLOCKED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bed className="h-4 w-4" />;
    }
  };

  const filteredBeds = beds.filter(bed => {
    const matchesWard = selectedWard === "all" || bed.ward.id === selectedWard;
    const matchesStatus = selectedStatus === "all" || bed.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.ward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bed.currentAdmission && 
        `${bed.currentAdmission.patient.firstName} ${bed.currentAdmission.patient.lastName}`
          .toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesWard && matchesStatus && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">IPD Management</h1>
          <p className="text-gray-600 mt-1">In-Patient Department - Bed & Ward Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchIPDData}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beds</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalBeds}</p>
              </div>
              <Bed className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-red-600">{overallStats.occupiedBeds}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.availableBeds}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{overallStats.maintenanceBeds}</p>
              </div>
              <Settings className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy</p>
                <p className="text-2xl font-bold text-purple-600">{overallStats.occupancyRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wards" className="cursor-pointer">Ward Management</TabsTrigger>
          <TabsTrigger value="beds" className="cursor-pointer">Bed Type</TabsTrigger>
        </TabsList>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span className="font-semibold">{ward.capacity} beds</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-green-600">
                        ✓ Available: {ward.statistics.availableBeds}
                      </div>
                      <div className="text-red-600">
                        ● Occupied: {ward.statistics.occupiedBeds}
                      </div>
                      <div className="text-yellow-600">
                        ⚙ Maintenance: {ward.statistics.maintenanceBeds}
                      </div>
                      <div className="text-gray-600">
                        ⏸ Blocked: {ward.statistics.blockedBeds}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-600">Occupancy Rate</span>
                      <Badge 
                        variant={ward.statistics.occupancyRate > 80 ? "destructive" : 
                               ward.statistics.occupancyRate > 60 ? "secondary" : "default"}
                      >
                        {ward.statistics.occupancyRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search beds, wards, or patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={selectedWard} onValueChange={setSelectedWard}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {wards.filter(ward => ward.id && ward.id.trim() !== "").map((ward) => (
                  <SelectItem key={ward.id} value={ward.id}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Beds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => (
              <Card key={bed.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{bed.bedNumber}</h3>
                      <Badge className={getStatusColor(bed.status)}>
                        {getStatusIcon(bed.status)}
                        <span className="ml-1">{bed.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>Ward:</strong> {bed.ward.name}</p>
                      <p><strong>Type:</strong> {bed.bedType.name}</p>
                      <p><strong>Rate:</strong> ₹{bed.bedType.dailyRate}/day</p>
                    </div>

                    {bed.currentAdmission && (
                      <div className="bg-red-50 p-2 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800">
                          Patient: {bed.currentAdmission.patient.firstName} {bed.currentAdmission.patient.lastName}
                        </p>
                        <p className="text-xs text-red-600">
                          Admitted by: {bed.currentAdmission.admittedByUser.name}
                        </p>
                      </div>
                    )}

                    {bed.notes && (
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">{bed.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredBeds.length === 0 && (
            <div className="text-center py-12">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No beds found matching your criteria</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
