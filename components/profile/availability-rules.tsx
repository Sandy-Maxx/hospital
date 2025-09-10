"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Calendar, Settings } from "lucide-react";
import Link from "next/link";

interface AvailabilityRule {
  id: string;
  type: "UNAVAILABLE" | "LEAVE" | "HOLIDAY" | "CUSTOM";
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  weekdays?: number[] | string | null;
  reason?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  userId?: string;
}

export default function AvailabilityRules({ userId }: Props) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailabilityRules();
  }, [userId]);

  const fetchAvailabilityRules = async () => {
    try {
      const response = await fetch(`/api/doctors/availability${userId ? `?doctorId=${userId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setRules(data.availabilityRules || []);
      } else {
        console.warn('Could not fetch availability rules:', response.status);
        setRules([]);
      }
    } catch (error) {
      console.error("Error fetching availability rules:", error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      UNAVAILABLE: "bg-red-100 text-red-800",
      LEAVE: "bg-yellow-100 text-yellow-800",
      HOLIDAY: "bg-blue-100 text-blue-800",
      CUSTOM: "bg-purple-100 text-purple-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatWeekdays = (weekdays?: number[] | string) => {
    if (!weekdays) return null;
    
    let weekdayArray: number[] = [];
    
    // Handle both array and JSON string formats
    if (typeof weekdays === 'string') {
      try {
        weekdayArray = JSON.parse(weekdays);
      } catch (error) {
        console.error('Error parsing weekdays:', error);
        return null;
      }
    } else if (Array.isArray(weekdays)) {
      weekdayArray = weekdays;
    } else {
      return null;
    }
    
    if (!weekdayArray.length) return null;
    
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return weekdayArray.map(d => days[d]).join(", ");
  };

  const formatDateRange = (rule: AvailabilityRule) => {
    try {
      const start = new Date(rule.startDate).toLocaleDateString();
      if (rule.endDate) {
        const end = new Date(rule.endDate).toLocaleDateString();
        return `${start} - ${end}`;
      }
      return start;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return 'Invalid date';
    }
  };

  const formatTimeRange = (rule: AvailabilityRule) => {
    try {
      if (rule.startTime && rule.endTime) {
        return `${rule.startTime} - ${rule.endTime}`;
      }
      return "All day";
    } catch (error) {
      console.error('Error formatting time range:', error);
      return 'Invalid time';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Availability Rules
          </CardTitle>
          <Link href="/admin/doctor-availability">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Manage</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No availability rules set</p>
            <p className="text-sm">Visit the availability page to manage your schedule</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 border rounded-lg ${
                  rule.isActive ? "border-gray-200" : "border-gray-100 opacity-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(rule.type)}>
                      {rule.type}
                    </Badge>
                    {rule.isRecurring && (
                      <Badge variant="outline">Recurring</Badge>
                    )}
                    {!rule.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    #{rule.id.slice(-8)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDateRange(rule)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {formatTimeRange(rule)}
                  </div>
                  {rule.weekdays && (
                    <div>
                      <span className="font-medium">Days:</span> {formatWeekdays(rule.weekdays)}
                    </div>
                  )}
                  {rule.reason && (
                    <div>
                      <span className="font-medium">Reason:</span> {rule.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
