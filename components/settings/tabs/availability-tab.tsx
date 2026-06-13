"use client";

import React, { useState } from "react";
import { Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { updateAvailability } from "@/actions/settings";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityTab({ initialData }: { initialData: any[] }) {
  const [availability, setAvailability] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const updateDay = (dayIndex: number, field: string, value: any) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day_of_week === dayIndex ? { ...d, [field]: value } : d
      )
    );
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    let hasError = false;

    // Save each day sequentially (or use Promise.all)
    for (const day of availability) {
      const { error } = await updateAvailability(day.day_of_week, {
        is_available: day.is_available,
        start_time: day.start_time,
        end_time: day.end_time,
        break_start: day.break_start,
        break_end: day.break_end,
      });

      if (error) {
        hasError = true;
        toast.error(`Error saving ${DAY_LABELS[day.day_of_week]}: ${error}`);
      }
    }

    setIsLoading(false);
    if (!hasError) {
      toast.success("Availability updated successfully");
      setIsDirty(false);
    }
  };

  // Calculate total open hours per week
  const calculateTotalHours = () => {
    let totalMinutes = 0;
    availability.forEach((day) => {
      if (!day.is_available) return;
      
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(":");
        return parseInt(h) * 60 + parseInt(m);
      };

      const start = parseTime(day.start_time);
      const end = parseTime(day.end_time);
      const bStart = parseTime(day.break_start);
      const bEnd = parseTime(day.break_end);

      let dayMins = end - start;
      if (bStart && bEnd && bEnd > bStart) {
        dayMins -= (bEnd - bStart);
      }
      if (dayMins > 0) totalMinutes += dayMins;
    });

    return (totalMinutes / 60).toFixed(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between pb-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Availability</h2>
            <p className="text-sm text-muted-foreground">
              Set your weekly operating hours and breaks. Your clinic is currently open for {calculateTotalHours()} hours per week.
            </p>
          </div>
        </div>
      </div>


      <div className="space-y-4">
        {/* Header row */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 text-sm font-semibold text-muted-foreground">
          <div className="col-span-2">Day</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-4">Working Hours</div>
          <div className="col-span-4">Break Time (Optional)</div>
        </div>

        {availability.map((day) => (
          <div 
            key={day.day_of_week} 
            className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 p-4 rounded-xl border items-center transition-all ${day.is_available ? 'bg-card border-border shadow-sm' : 'bg-muted/30 border-transparent'}`}
          >
            {/* Day name */}
            <div className="col-span-2 font-medium text-sm">
              {DAY_LABELS[day.day_of_week]}
            </div>

            {/* Toggle */}
            <div className="col-span-2 flex items-center gap-2">
              <Switch 
                checked={day.is_available} 
                onCheckedChange={(v) => updateDay(day.day_of_week, "is_available", v)}
              />
              <span className="text-xs text-muted-foreground lg:hidden">
                {day.is_available ? "Open" : "Closed"}
              </span>
            </div>

            {/* Working Hours */}
            <div className="col-span-4 flex items-center gap-2">
              <input
                type="time"
                value={day.start_time}
                onChange={(e) => updateDay(day.day_of_week, "start_time", e.target.value)}
                disabled={!day.is_available}
                className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="time"
                value={day.end_time}
                onChange={(e) => updateDay(day.day_of_week, "end_time", e.target.value)}
                disabled={!day.is_available}
                className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>

            {/* Break Time */}
            <div className="col-span-4 flex items-center gap-2">
              <input
                type="time"
                value={day.break_start || ""}
                onChange={(e) => updateDay(day.day_of_week, "break_start", e.target.value)}
                disabled={!day.is_available}
                className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="time"
                value={day.break_end || ""}
                onChange={(e) => updateDay(day.day_of_week, "break_end", e.target.value)}
                disabled={!day.is_available}
                className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} size="lg" isLoading={isLoading} disabled={!isDirty}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
