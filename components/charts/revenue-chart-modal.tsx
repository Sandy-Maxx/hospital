"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CreditCard } from "lucide-react";

interface RevenueChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: any[];
}

export default function RevenueChartModal({
  isOpen,
  onClose,
  bills,
}: RevenueChartModalProps) {
  const [viewType, setViewType] = useState<
    "day" | "week" | "month" | "quarter" | "year"
  >("month");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<
    "day" | "week" | "month" | "quarter" | "year"
  >("month");

  if (!isOpen) return null;

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const addMonths = (d: Date, n: number) => {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  };
  const addYears = (d: Date, n: number) => {
    const x = new Date(d);
    x.setFullYear(x.getFullYear() + n);
    return x;
  };

  const rangeStart = () => {
    const now = new Date();
    switch (durationUnit) {
      case "day":
        return addDays(now, -durationValue);
      case "week":
        return addDays(now, -7 * durationValue);
      case "month":
        return addMonths(now, -durationValue);
      case "quarter":
        return addMonths(now, -3 * durationValue);
      case "year":
        return addYears(now, -durationValue);
    }
  };

  const amountOf = (bill: any) =>
    typeof bill.finalAmount === "number"
      ? bill.finalAmount
      : bill.totalAmount || 0;

  const getChartData = () => {
    const now = new Date();
    const start = rangeStart();
    const data: { label: string; amount: number }[] = [];

    const sumInRange = (from: Date, to: Date) =>
      bills
        .filter((b) => {
          const d = new Date(b.createdAt);
          return d >= from && d < to;
        })
        .reduce((s, b) => s + amountOf(b), 0);

    let cursor = new Date(start);
    while (cursor < now) {
      let next: Date;
      let label = "";
      if (viewType === "day") {
        next = addDays(cursor, 1);
        label = cursor.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        });
      } else if (viewType === "week") {
        next = addDays(cursor, 7);
        label = `Wk of ${cursor.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`;
      } else if (viewType === "month") {
        next = addMonths(cursor, 1);
        label = cursor.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      } else if (viewType === "quarter") {
        next = addMonths(cursor, 3);
        const q = Math.floor(cursor.getMonth() / 3) + 1;
        label = `Q${q} ${cursor.getFullYear()}`;
      } else {
        next = addYears(cursor, 1);
        label = `${cursor.getFullYear()}`;
      }
      data.push({ label, amount: sumInRange(cursor, next < now ? next : now) });
      cursor = next;
    }

    return data;
  };

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);
  const total = chartData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-6 h-6 mr-2 text-green-600" />
              Revenue Analytics
            </h2>
            <p className="text-gray-600 mt-1">Visualize revenue trends</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="flex space-x-2">
            <Button
              variant={viewType === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("day")}
            >
              Daily
            </Button>
            <Button
              variant={viewType === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("week")}
            >
              Weekly
            </Button>
            <Button
              variant={viewType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("month")}
            >
              Monthly
            </Button>
            <Button
              variant={viewType === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("quarter")}
            >
              Quarterly
            </Button>
            <Button
              variant={viewType === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("year")}
            >
              Yearly
            </Button>
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            <div>
              <label className="block text-xs text-gray-600">Duration</label>
              <input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) =>
                  setDurationValue(parseInt(e.target.value || "1"))
                }
                className="w-20 p-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Unit</label>
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as any)}
                className="p-1 border rounded"
              >
                <option value="day">Days</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
                <option value="quarter">Quarters</option>
                <option value="year">Years</option>
              </select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              Distribution based on selected duration and frequency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">
                      ₹{item.amount.toFixed(0)}
                    </div>
                    <div
                      className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                      style={{
                        height: `${Math.max((item.amount / maxAmount) * 200, 4)}px`,
                        minHeight: "4px",
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Summary</h3>
          <p className="text-green-800 text-sm">
            Total revenue in selected period:{" "}
            <strong>₹{total.toLocaleString()}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
