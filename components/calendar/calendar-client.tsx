"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/actions/appointments";
import { getAppointments } from "@/actions/appointments";
import { DaySlideOver } from "./day-slide-over";
import { AddAppointmentModal } from "@/components/appointments/add-appointment-modal";
import { createClient } from "@/lib/supabase/client";

import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];

interface CalendarClientProps {
  initialAppointments: AppointmentWithRelations[];
  initialBlockedDates: any[];
  initialDate: Date;
  services: Service[];
  patients: Patient[];
}

export function CalendarClient({
  initialAppointments,
  initialBlockedDates,
  initialDate,
  services,
  patients,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Day slide over state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Add appointment modal state (general, not specific to a day initially)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch appointments when month changes
  useEffect(() => {
    if (isSameMonth(currentDate, initialDate)) {
      setAppointments(initialAppointments);
      return;
    }

    const fetchAppts = async () => {
      setIsLoading(true);
      const dateFrom = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const dateTo = format(endOfMonth(currentDate), "yyyy-MM-dd");
      
      const res = await getAppointments({ dateFrom, dateTo });
      if (res.data) {
        setAppointments(res.data);
      }
      setIsLoading(false);
    };

    fetchAppts();
  }, [currentDate, initialDate, initialAppointments]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('calendar-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          handleAppointmentsChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsSlideOverOpen(true);
  };

  const handleAppointmentsChange = async () => {
    // Refresh appointments
    const dateFrom = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const dateTo = format(endOfMonth(currentDate), "yyyy-MM-dd");
    const res = await getAppointments({ dateFrom, dateTo });
    if (res.data) {
      setAppointments(res.data);
    }
  };

  // Grid calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  
  // To make a proper calendar grid, we need to know the day of the week the month starts on
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Sunday start
  
  const endDate = new Date(monthEnd);
  if (endDate.getDay() !== 6) {
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // Saturday end
  }

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter(a => a.status === statusFilter);
  }, [appointments, statusFilter]);

  // Helper to get day's data
  const getDayData = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayAppts = filteredAppointments.filter(a => a.appointment_date === dayStr);
    const isBlocked = initialBlockedDates.some(b => b.blocked_date === dayStr);
    
    // Status dot color logic
    let dotColor = null;
    if (dayAppts.length > 0) {
      const hasNoShow = dayAppts.some(a => a.status === "no_show");
      const hasPending = dayAppts.some(a => a.status === "pending");
      const allConfirmedOrCompleted = dayAppts.every(a => ["confirmed", "completed"].includes(a.status));
      
      if (hasNoShow) dotColor = "bg-red-500";
      else if (hasPending) dotColor = "bg-amber-500";
      else if (allConfirmedOrCompleted) dotColor = "bg-emerald-500";
      else dotColor = "bg-primary";
    }

    return { dayAppts, isBlocked, dotColor };
  };

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border gap-4 bg-background">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToday} className="font-medium text-sm px-3">
              Today
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-bold min-w-[150px]">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
          <Select
            options={[
              { label: "All Statuses", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Confirmed", value: "confirmed" },
              { label: "Completed", value: "completed" },
              { label: "No Show", value: "no_show" },
              { label: "Cancelled", value: "cancelled" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36 h-9 py-1 text-sm rounded-lg"
          />
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>
      </div>

      {/* ── Calendar Grid ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-background p-6 pt-0 overflow-y-auto custom-scrollbar">
        {/* Weekdays header */}
        <div className="grid grid-cols-7 mb-3">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-auto gap-3">
          {dateRange.map((day, i) => {
            const { dayAppts, isBlocked, dotColor } = getDayData(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "relative p-3 transition-all cursor-pointer group rounded-2xl flex flex-col justify-between min-h-[100px]",
                  !isCurrentMonth ? "bg-card/40 text-muted-foreground/30 border border-border/30" : "bg-card border border-border/60 hover:border-border",
                  isSelected && "border-primary/50 shadow-[0_0_0_1px_rgba(var(--primary),0.5)]",
                  isBlocked && "bg-stripe opacity-75"
                )}
              >
                {/* Header: Date number & Badge */}
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "text-sm font-bold flex items-center justify-center rounded-full transition-colors",
                      isToday(day) ? "bg-primary text-primary-foreground h-6 w-6 text-xs" : "",
                      !isToday(day) && isCurrentMonth ? "text-foreground" : ""
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  
                  {isBlocked ? (
                    <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                      Blocked
                    </span>
                  ) : dayAppts.length > 0 ? (
                    <div className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {dayAppts.length} {dayAppts.length === 1 ? 'Appt' : 'Appts'}
                    </div>
                  ) : null}
                </div>

                {/* Content: Lines (Status indicators) */}
                <div className="mt-auto pt-4 space-y-1">
                  {dayAppts.length > 0 && !isBlocked && (
                    <div className="flex gap-1 h-1.5 w-full">
                      {dayAppts.map((appt, idx) => {
                        let bgColor = "bg-primary";
                        if (appt.status === "no_show" || appt.status === "cancelled") bgColor = "bg-red-500";
                        else if (appt.status === "pending") bgColor = "bg-amber-500";
                        else if (appt.status === "completed") bgColor = "bg-emerald-500";
                        
                        return (
                          <div 
                            key={`${appt.id}-${idx}`} 
                            className={cn("flex-1 rounded-full", bgColor)} 
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DaySlideOver
        isOpen={isSlideOverOpen}
        onClose={() => setIsSlideOverOpen(false)}
        date={selectedDay}
        appointments={selectedDay ? getDayData(selectedDay).dayAppts : []}
        onAppointmentsChange={handleAppointmentsChange}
        services={services}
        patients={patients}
      />

      <AddAppointmentModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          setIsAddModalOpen(false);
          handleAppointmentsChange();
        }}
        services={services}
        patients={patients}
      />
    </div>
  );
}
