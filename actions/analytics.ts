"use server";

import { createClient } from "@/lib/supabase/server";
import { subDays, format, startOfDay, endOfDay, parseISO } from "date-fns";

export type AnalyticsData = {
  trends: { date: string; total: number; confirmed: number; completed: number; cancelled: number }[];
  services: { name: string; count: number }[];
  peakHours: { hour: string; count: number }[];
  insights: { 
    totalAppointments: number; 
    uniquePatients: number; 
    returningRatio: number; 
    newRatio: number;
    estimatedRevenue: number;
    widgetRatio: number;
    dashboardRatio: number;
  };
  languages: { name: string; count: number }[];
};

export async function getAnalytics(range: string = "7d", customStart?: string, customEnd?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  let startDate = startOfDay(new Date());
  let endDate = endOfDay(new Date());

  if (range === "custom" && customStart && customEnd) {
    startDate = startOfDay(parseISO(customStart));
    endDate = endOfDay(parseISO(customEnd));
  } else {
    const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
    startDate = startOfDay(subDays(new Date(), days - 1));
  }

  const [{ data: appointments, error }, { data: allServices }] = await Promise.all([
    supabase
      .from("appointments")
      .select("appointment_date, start_time, status, service_name, service_id, patient_phone, booked_via, booking_language")
      .eq("clinic_id", user.id)
      .gte("appointment_date", format(startDate, "yyyy-MM-dd"))
      .lte("appointment_date", format(endDate, "yyyy-MM-dd")),
    supabase
      .from("services")
      .select("id, name, price")
      .eq("clinic_id", user.id)
  ]);

  if (error) {
    return { data: null, error: error.message };
  }

  // 1. Trends
  const trendsMap = new Map<string, { total: number; confirmed: number; completed: number; cancelled: number }>();
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    trendsMap.set(format(d, "yyyy-MM-dd"), { total: 0, confirmed: 0, completed: 0, cancelled: 0 });
  }

  // 2. Services
  const servicesMap = new Map<string, number>();
  const serviceIdToNameMap = new Map<string, string>();
  const serviceIdToPriceMap = new Map<string, number>();
  allServices?.forEach((s) => {
    servicesMap.set(s.name, 0);
    serviceIdToNameMap.set(s.id, s.name);
    serviceIdToPriceMap.set(s.id, s.price || 0);
  });

  // 3. Peak Hours
  const peakHoursMap = new Map<string, number>();
  for (let i = 0; i < 24; i++) {
    peakHoursMap.set(i.toString().padStart(2, "0") + ":00", 0);
  }

  // 4. Insights & Extra
  const uniquePatients = new Set<string>();
  let totalRevenue = 0;
  let widgetCount = 0;
  let dashboardCount = 0;
  const languagesMap = new Map<string, number>([["en", 0], ["hi", 0]]);

  appointments?.forEach((appt) => {
    // Trends
    const dayData = trendsMap.get(appt.appointment_date);
    if (dayData) {
      dayData.total++;
      if (appt.status === "confirmed") dayData.confirmed++;
      if (appt.status === "completed") dayData.completed++;
      if (appt.status === "cancelled" || appt.status === "no_show") dayData.cancelled++;
    }

    // Services
    const resolvedServiceName = appt.service_id ? serviceIdToNameMap.get(appt.service_id) : appt.service_name;
    if (resolvedServiceName) {
      servicesMap.set(resolvedServiceName, (servicesMap.get(resolvedServiceName) || 0) + 1);
    }

    // Peak Hours
    if (appt.start_time) {
      const hour = appt.start_time.split(":")[0] + ":00";
      peakHoursMap.set(hour, (peakHoursMap.get(hour) || 0) + 1);
    }

    // Insights
    if (appt.patient_phone) {
      uniquePatients.add(appt.patient_phone);
    }

    // Revenue (only for confirmed/completed)
    if (appt.status === "confirmed" || appt.status === "completed") {
      if (appt.service_id) {
        totalRevenue += serviceIdToPriceMap.get(appt.service_id) || 0;
      }
    }

    // Booking Source
    if (appt.booked_via === "widget") widgetCount++;
    else dashboardCount++;

    // Languages
    const lang = appt.booking_language || "en";
    languagesMap.set(lang, (languagesMap.get(lang) || 0) + 1);
  });

  const trends = Array.from(trendsMap.entries()).map(([date, counts]) => ({
    date: format(parseISO(date), "MMM dd"),
    ...counts,
  }));

  const services = Array.from(servicesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const peakHours = Array.from(peakHoursMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .filter(h => h.count > 0 || (parseInt(h.hour) >= 8 && parseInt(h.hour) <= 20)); // Keep typical hours even if 0

  const totalAppointments = appointments?.length || 0;
  const uniquePatientsCount = uniquePatients.size;
  const newRatio = totalAppointments > 0 ? (uniquePatientsCount / totalAppointments) * 100 : 0;
  const returningRatio = totalAppointments > 0 ? 100 - newRatio : 0;
  const widgetRatio = totalAppointments > 0 ? (widgetCount / totalAppointments) * 100 : 0;

  const insights = {
    totalAppointments,
    uniquePatients: uniquePatientsCount,
    newRatio: Math.round(newRatio),
    returningRatio: Math.round(returningRatio),
    estimatedRevenue: totalRevenue,
    widgetRatio: Math.round(widgetRatio),
    dashboardRatio: Math.round(100 - widgetRatio),
  };

  const languages = Array.from(languagesMap.entries()).map(([name, count]) => ({
    name: name === "en" ? "English" : "Hindi",
    count
  }));

  return {
    data: { trends, services, peakHours, insights, languages },
    error: null,
  };
}
