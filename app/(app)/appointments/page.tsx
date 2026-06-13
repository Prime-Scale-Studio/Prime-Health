import React from "react";
import { getAppointments } from "@/actions/appointments";
import { getPatients } from "@/actions/patients";
import { getActiveServices } from "@/actions/services";
import { getMyClinic } from "@/actions/clinic";
import { RealtimeSubscriber } from "@/components/layout/realtime-subscriber";
import { AppointmentPageClient } from "./client-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointments | Prime Health",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppointmentsPage() {
  const [appointmentsRes, patientsRes, servicesRes, clinicRes] = await Promise.all([
    getAppointments(),
    getPatients(),
    getActiveServices(),
    getMyClinic(),
  ]);

  const appointments = appointmentsRes.data || [];
  const patients = patientsRes.data || [];
  const services = servicesRes.data || [];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      {clinicRes.data?.id && (
        <RealtimeSubscriber clinicId={clinicRes.data.id} enableAppointments />
      )}
      {/* Client component wrapper to handle states and modals */}
      <AppointmentPageClient 
        initialAppointments={appointments} 
        patients={patients} 
        services={services} 
      />
    </div>
  );
}
