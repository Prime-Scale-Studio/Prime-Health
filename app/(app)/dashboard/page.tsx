import React, { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { 
  Users, 
  CalendarCheck2, 
  ActivitySquare, 
  CheckCircle2,
  Plus,
  CalendarDays
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getAppointments, getTodaysAppointments } from "@/actions/appointments";
import { getPatients } from "@/actions/patients";
import { format, subDays } from "date-fns";
import { DashboardRealtimeListener } from "./client-dashboard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Lazy load charts
const AppointmentChart = nextDynamic(() => import("@/components/dashboard/appointment-chart").then(mod => mod.AppointmentChart), {
  loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
});

const StatusDistribution = nextDynamic(() => import("@/components/dashboard/status-distribution").then(mod => mod.StatusDistribution), {
  loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
});

export const metadata: Metadata = {
  title: "Dashboard | Prime Health",
  description: "View your clinic's performance and upcoming appointments.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  // Fetch real data server-side
  const [todaysApptsRes, allApptsRes, patientsRes] = await Promise.all([
    getTodaysAppointments(),
    getAppointments(),
    getPatients(),
  ]);

  if (todaysApptsRes.error || allApptsRes.error || patientsRes.error) {
    // In a real app, we might want to log this or show a more specific error UI
    console.error("Error fetching dashboard data:", {
      todays: todaysApptsRes.error,
      all: allApptsRes.error,
      patients: patientsRes.error,
    });
  }

  const todaysAppts = todaysApptsRes.data || [];
  const allAppts = allApptsRes.data || [];
  const patients = patientsRes.data || [];

  // ── Calculate Stats ──────────────────────────────
  
  // Total Patients
  const totalPatients = patients.length;

  // This Month Appointments
  const now = new Date();
  const currentMonthStr = format(now, "yyyy-MM");
  const thisMonthAppts = allAppts.filter(a => a.appointment_date.startsWith(currentMonthStr));
  const thisMonthCount = thisMonthAppts.length;

  // Completion Rate
  const completedAppts = allAppts.filter(a => a.status === "completed").length;
  const completionRate = allAppts.length > 0 ? Math.round((completedAppts / allAppts.length) * 100) : 0;

  // ── Chart Data (Last 30 Days) ──────────────────
  const thirtyDaysAgo = subDays(now, 30);
  const chartDataMap = new Map<string, number>();
  
  // Initialize last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = subDays(now, 29 - i);
    chartDataMap.set(format(d, "yyyy-MM-dd"), 0);
  }

  // Populate actual counts
  allAppts.forEach(a => {
    if (chartDataMap.has(a.appointment_date)) {
      chartDataMap.set(a.appointment_date, chartDataMap.get(a.appointment_date)! + 1);
    }
  });

  const trendData = Array.from(chartDataMap.entries()).map(([date, count]) => ({ date, count }));

  // ── Status Distribution ────────────────────────
  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
  allAppts.forEach(a => {
    if (a.status in statusCounts) {
      statusCounts[a.status as keyof typeof statusCounts]++;
    }
  });
  
  const distributionData = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as any,
    count
  }));

  // ── Recent Appointments (Top 10) ───────────────
  const recentAppts = allAppts.slice(0, 10);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      <DashboardRealtimeListener />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Welcome back! Here's an overview of your clinic today.
          </p>
        </div>
        <Link href="/appointments">
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30">
            <Plus className="mr-2 h-5 w-5" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* ── Stat Cards Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Today's Appointments"
          value={todaysAppts.length}
          icon={<CalendarCheck2 />}
          iconColor="bg-blue-500/10"
          iconTextColor="text-blue-600"
        />
        <StatCard
          label="Total Patients"
          value={totalPatients}
          icon={<Users />}
          iconColor="bg-emerald-500/10"
          iconTextColor="text-emerald-600"
          change={12} // Example change, would normally compute
          changeLabel="this month"
        />
        <StatCard
          label="Appointments This Month"
          value={thisMonthCount}
          icon={<ActivitySquare />}
          iconColor="bg-purple-500/10"
          iconTextColor="text-purple-600"
        />
        <StatCard
          label="Completion Rate"
          value={completionRate}
          suffix="%"
          icon={<CheckCircle2 />}
          iconColor="bg-primary/10"
          iconTextColor="text-primary"
          change={completionRate > 80 ? 5 : -2} // Example change
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {allAppts.length > 0 ? (
            <AppointmentChart data={trendData} />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <CalendarDays className="h-10 w-10 opacity-20" />
              <p>No data to display in chart</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {allAppts.length > 0 ? (
            <StatusDistribution data={distributionData} />
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-2">
              <ActivitySquare className="h-10 w-10 opacity-20" />
              <p>No status distribution yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Appointments Table ─────────────────────────────────────── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Appointments</h2>
          {recentAppts.length > 0 && (
            <Link href="/appointments">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                View All
              </Button>
            </Link>
          )}
        </div>
        {recentAppts.length > 0 ? (
          <AppointmentTable data={recentAppts} minimal />
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
              <CalendarDays className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">No appointments yet</h3>
            <p className="text-muted-foreground mb-6">Start by booking your first appointment.</p>
            <Link href="/appointments">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
