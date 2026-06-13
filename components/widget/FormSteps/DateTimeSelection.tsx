"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Calendar, Clock } from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addDays,
} from "date-fns";
import { useWidgetStore } from "../useWidgetStore";

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export function DateTimeSelection() {
  const { clinicId, formData, updateFormData, themeColor } = useWidgetStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = new Date(monthStart);
  calStart.setDate(calStart.getDate() - calStart.getDay());
  const calEnd = new Date(monthEnd);
  if (calEnd.getDay() !== 6) calEnd.setDate(calEnd.getDate() + (6 - calEnd.getDay()));
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const fetchSlots = useCallback(async (date: string) => {
    if (!clinicId) return;
    setLoadingSlots(true);
    setSlots([]);
    try {
      const params = new URLSearchParams({ clinicId, date });
      if (formData.serviceId) params.set("serviceId", formData.serviceId);
      const res = await fetch(`/api/widget/slots?${params}`);
      if (res.ok) {
        const data = await res.json() as { slots: TimeSlot[] };
        setSlots(data.slots ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSlots(false);
    }
  }, [clinicId, formData.serviceId]);

  useEffect(() => {
    if (formData.date) fetchSlots(formData.date);
  }, [formData.date, fetchSlots]);

  const handleDayClick = (day: Date) => {
    if (isBefore(day, today) || isBefore(maxDate, day)) return;
    const dateStr = format(day, "yyyy-MM-dd");
    updateFormData({ date: dateStr, time: null });
  };

  const isDisabledDay = (day: Date) =>
    isBefore(day, today) || isBefore(maxDate, day);

  const availableSlots = slots.filter((s) => s.available);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
      {/* Calendar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 mb-3">Choose a date</h3>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={isSameMonth(currentMonth, new Date())}
            className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <span className="text-sm font-bold text-slate-800">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calDays.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const disabled = isDisabledDay(day);
            const isSelected = formData.date
              ? isSameDay(day, new Date(formData.date + "T00:00:00"))
              : false;
            const todayDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => !disabled && inMonth && handleDayClick(day)}
                disabled={disabled || !inMonth}
                className={`
                  aspect-square rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center
                  ${!inMonth ? "opacity-0 cursor-default" : ""}
                  ${disabled && inMonth ? "text-slate-300 cursor-not-allowed" : ""}
                  ${!disabled && inMonth && !isSelected ? "hover:bg-slate-100 text-slate-700" : ""}
                  ${isSelected ? "text-white shadow-md" : ""}
                  ${todayDay && !isSelected && !disabled ? "ring-2 ring-inset" : ""}
                `}
                style={{
                  ...(isSelected ? { backgroundColor: themeColor } : {}),
                  ...(todayDay && !isSelected && !disabled ? { ringColor: themeColor } : {}),
                }}
                aria-label={format(day, "MMMM d, yyyy")}
                aria-pressed={isSelected}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      {formData.date && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Clock size={16} style={{ color: themeColor }} />
            Select a time
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-medium">
            {format(new Date(formData.date + "T00:00:00"), "EEE, MMM d yyyy")}
          </p>

          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-6">
              <Calendar size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400 font-medium">No slots available on this day</p>
              <p className="text-xs text-slate-400 mt-1">Please choose another date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const isSelected = formData.time === slot.startTime;
                return (
                  <button
                    key={slot.startTime}
                    onClick={() => slot.available && updateFormData({ time: slot.startTime })}
                    disabled={!slot.available}
                    className={`
                      h-10 rounded-xl text-xs font-bold transition-all duration-150 focus-visible:outline-none border
                      ${!slot.available
                        ? "bg-slate-50 text-slate-300 border-transparent cursor-not-allowed line-through"
                        : isSelected
                        ? "text-white shadow-sm border-transparent"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }
                    `}
                    style={{
                      ...(isSelected ? { backgroundColor: themeColor } : {}),
                      ...(slot.available && !isSelected ? { color: themeColor } : {})
                    }}
                    aria-label={`Book ${formatTime(slot.startTime)}`}
                    aria-pressed={isSelected}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
