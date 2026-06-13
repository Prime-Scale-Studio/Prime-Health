import React from "react";
import type { Metadata } from "next";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { getAppointments } from "@/actions/appointments";
import { getBlockedDates } from "@/actions/settings";
import { startOfMonth, endOfMonth, format } from "date-fns";

import { getActiveServices } from "@/actions/services";
import { getPatients } from "@/actions/patients";

export const metadata: Metadata = {
  title: "Calendar | Prime Health",
  description: "Manage your schedule and appointments",
};

export default async function CalendarPage() {
  const now = new Date();
  const dateFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const dateTo = format(endOfMonth(now), "yyyy-MM-dd");

  const [appointmentsRes, blockedDatesRes, servicesRes, patientsRes] = await Promise.all([
    getAppointments({ dateFrom, dateTo }),
    getBlockedDates(),
    getActiveServices(),
    getPatients(),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Manage your schedule and appointments.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <CalendarClient 
          initialAppointments={appointmentsRes.data || []}
          initialBlockedDates={blockedDatesRes.data || []}
          initialDate={now}
          services={servicesRes.data || []}
          patients={patientsRes.data || []}
        />
      </div>
    </div>
  );
}
