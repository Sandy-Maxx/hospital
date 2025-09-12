"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
const ReceptionistDashboard = dynamic(
  () => import("@/app/(authenticated)/receptionist/page"),
  { ssr: false },
);
const PatientChartModal = dynamic(
  () => import("@/components/charts/patient-chart-modal"),
  { ssr: false },
);
const RevenueChartModal = dynamic(
  () => import("@/components/charts/revenue-chart-modal"),
  { ssr: false },
);

const recentActivities = [
  {
    id: 1,
    type: "appointment",
    message: "New appointment booked for John Doe",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "consultation",
    message: "Dr. Smith completed consultation with Jane Smith",
    time: "15 minutes ago",
  },
  {
    id: 3,
    type: "payment",
    message: "Payment received from Michael Johnson - ₹1,500",
    time: "30 minutes ago",
  },
  {
    id: 4,
    type: "registration",
    message: "New patient registered - Sarah Wilson",
    time: "1 hour ago",
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [weeklyPatients, setWeeklyPatients] = useState<number>(0);
  const [appointmentsForCharts, setAppointmentsForCharts] = useState<any[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<number>(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
  const [billsForCharts, setBillsForCharts] = useState<any[]>([]);

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const fetchDashboard = async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - (day - 1));

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const to = new Date(now);

    const paramsWeek = new URLSearchParams({
      from: startOfWeek.toISOString(),
      to: to.toISOString(),
      status: "COMPLETED",
      limit: "10000",
    });
    const paramsYear = new URLSearchParams({
      from: startOfYear.toISOString(),
      to: to.toISOString(),
      status: "COMPLETED",
      limit: "100000",
    });

    fetch(`/api/appointments?${paramsWeek.toString()}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setWeeklyPatients((data.appointments || []).length);
      }
    });

    fetch(`/api/appointments?${paramsYear.toString()}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setAppointmentsForCharts(data.appointments || []);
      }
    });

    // Today's appointments count
    const todayStr = new Date().toISOString().split("T")[0];
    const paramsToday = new URLSearchParams({ date: todayStr, limit: "10000" });
    fetch(`/api/appointments?${paramsToday.toString()}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setTodaysAppointments((data.appointments || []).length);
      }
    });

    // Monthly revenue and bills for charts
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const billParamsMonth = new URLSearchParams({
      from: startOfMonth.toISOString(),
      to: to.toISOString(),
      limit: "100000",
    });
    fetch(`/api/bills?${billParamsMonth.toString()}`).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        const bills = data.bills || [];
        setBillsForCharts(bills);
        const total = bills.reduce(
          (sum: number, b: any) =>
            sum +
            (typeof b.finalAmount === "number"
              ? b.finalAmount
              : b.totalAmount || 0),
          0,
        );
        setMonthlyRevenue(total);
      }
    });
  };

  useEffect(() => {
    fetchDashboard();
    const id = setInterval(fetchDashboard, 60000); // refresh every 60s

    // Refresh when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const getDashboardTitle = () => {
    const role = session?.user?.role;
    switch (role) {
      case "ADMIN":
        return "Admin Dashboard";
      case "DOCTOR":
        return "Doctor Dashboard";
      case "RECEPTIONIST":
        return "Receptionist Dashboard";
      default:
        return "Dashboard";
    }
  };

  // Role-aware dashboard: Receptionist sees the sessions dashboard here
  if (session?.user?.role === "RECEPTIONIST") {
    return <ReceptionistDashboard />;
  }

  // Doctor-focused quick view: show today's sessions summary with entry points
  if (session?.user?.role === "DOCTOR") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600">Today's sessions and queue</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/queue" className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>View Queue</CardTitle>
                <CardDescription>All sessions for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Go to live queue</div>
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/doctor" className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Start Consultation</CardTitle>
                <CardDescription>Open your consultation console</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Prescriptions, notes and more</div>
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getDashboardTitle()}
        </h1>
        <p className="text-gray-600">
          Welcome back, {session?.user?.name}! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Patients card: Nurses see only today's patients */}
        <Card
          className="cursor-pointer"
          onClick={() => setShowPatientModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {session?.user?.role === "NURSE"
                    ? `Today's Patients`
                    : "Total Patients (This Week)"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {session?.user?.role === "NURSE"
                    ? todaysAppointments
                    : weeklyPatients}
                </p>
                {session?.user?.role !== "NURSE" && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Based on completed appointments
                  </p>
                )}
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments - navigates to appointments page */}
        <Link href="/appointments" className="block">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Today's Appointments
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todaysAppointments}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Waiting Queue card hidden for nurses */}
        {session?.user?.role !== "NURSE" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Waiting Queue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                  <p className="text-sm text-gray-500">
                    Implement from queue API if needed
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* This Month's Revenue - hidden for nurses */}
        {session?.user?.role !== "NURSE" && (
          <Card
            className="cursor-pointer"
            onClick={() => setShowRevenueModal(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month's Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{monthlyRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest updates from the hospital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {session?.user?.role === "DOCTOR" && (
                <>
                  <Link
                    href="/queue"
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Clock className="w-6 h-6 text-yellow-600 mb-2" />
                    <p className="font-medium">View Queue</p>
                    <p className="text-sm text-gray-500">
                      Patient waiting list
                    </p>
                  </Link>
                  <Link
                    href="/doctor"
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Activity className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="font-medium">Start Consultation</p>
                    <p className="text-sm text-gray-500">Begin patient care</p>
                  </Link>
                </>
              )}
              {session?.user?.role === "ADMIN" && (
                <>
                  <Link
                    href="/staff"
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="font-medium">Manage Staff</p>
                    <p className="text-sm text-gray-500">Add/edit users</p>
                  </Link>
                  <Link
                    href="/reports"
                    className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <TrendingUp className="w-6 h-6 text-green-600 mb-2" />
                    <p className="font-medium">View Reports</p>
                    <p className="text-sm text-gray-500">
                      Analytics & insights
                    </p>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Modals */}
      <PatientChartModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        weeklyCount={weeklyPatients}
        appointments={appointmentsForCharts}
      />
      <RevenueChartModal
        isOpen={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        bills={billsForCharts}
      />
    </div>
  );
}
