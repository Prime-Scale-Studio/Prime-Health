"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ActivitySquare } from "lucide-react";

const AppointmentChart = dynamic(
  () => import("@/components/dashboard/appointment-chart").then((mod) => mod.AppointmentChart),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
    ssr: false,
  }
);

const StatusDistribution = dynamic(
  () => import("@/components/dashboard/status-distribution").then((mod) => mod.StatusDistribution),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
    ssr: false,
  }
);

interface DashboardChartsClientProps {
  trendData: { date: string; count: number }[];
  distributionData: { status: any; count: number }[];
  hasAppointments: boolean;
}

export default function DashboardChartsClient({
  trendData,
  distributionData,
  hasAppointments,
}: DashboardChartsClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {hasAppointments ? (
          <AppointmentChart data={trendData} />
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <CalendarDays className="h-10 w-10 opacity-20" />
            <p>No data to display in chart</p>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {hasAppointments ? (
          <StatusDistribution data={distributionData} />
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <ActivitySquare className="h-10 w-10 opacity-20" />
            <p>No status distribution yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
