import React from "react";
import type { Metadata } from "next";
import { SettingsClient } from "@/components/settings/settings-client";
import { getMyClinic } from "@/actions/clinic";
import { getAvailability, getBlockedDates } from "@/actions/settings";

export const metadata: Metadata = {
  title: "Settings | Prime Health",
  description: "Manage your clinic settings, availability, and notifications",
};

export default async function SettingsPage() {
  const [clinicRes, availabilityRes, blockedDatesRes] = await Promise.all([
    getMyClinic(),
    getAvailability(),
    getBlockedDates(),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Configure your clinic profile, availability, and preferences.
        </p>
      </div>

      <SettingsClient 
        initialClinic={clinicRes.data}
        initialAvailability={availabilityRes.data || []}
        initialBlockedDates={blockedDatesRes.data || []}
      />
    </div>
  );
}
