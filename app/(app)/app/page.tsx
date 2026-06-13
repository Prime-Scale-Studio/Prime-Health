import React from "react";
import dynamic from "next/dynamic";
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
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { getAppointments, getTodaysAppointments } from "@/actions/appointments";
import { getPatients } from "@/actions/patients";
import { getMyClinic } from "@/actions/clinic";
import { RealtimeSubscriber } from "@/components/layout/realtime-subscriber";
import { format, subDays } from "date-fns";

import type { Metadata } from "next";

import DashboardChartsClient from "@/components/dashboard/dashboard-charts-client";

export const metadata: Metadata = {
  title: "Dashboard | Prime Health",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  // Fetch real data server-side
  const [todaysApptsRes, allApptsRes, patientsRes, clinicRes] = await Promise.all([
    getTodaysAppointments(),
    getAppointments(),
    getPatients(),
    getMyClinic(),
  ]);

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
      {clinicRes.data?.id && (
        <RealtimeSubscriber clinicId={clinicRes.data.id} enableAppointments />
      )}


      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Welcome back! Here's an overview of your clinic today.
          </p>
        </div>
        <Link href="/app/appointments">
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
          change={12} 
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
          change={completionRate > 80 ? 5 : -2}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <DashboardChartsClient 
        trendData={trendData} 
        distributionData={distributionData} 
        hasAppointments={allAppts.length > 0} 
      />

      {/* ── Recent Appointments Table ─────────────────────────────────────── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Appointments</h2>
          {recentAppts.length > 0 && (
            <Link href="/app/appointments">
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                View All
              </Button>
            </Link>
          )}
        </div>
        {recentAppts.length > 0 ? (
          <AppointmentTable data={recentAppts} minimal />
        ) : (
          <EmptyState 
            icon={CalendarDays}
            title="No appointments yet"
            description="Start by booking your first appointment."
            actionLabel="Book Appointment"
            actionHref="/app/appointments"
            className="bg-card"
          />
        )}
      </div>
    </div>
  );
}
