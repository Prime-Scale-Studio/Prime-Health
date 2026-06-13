import React from "react";
import { getPatients } from "@/actions/patients";
import { PatientsPageClient } from "./client-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patients | Prime Health",
  description: "Manage your patient records and medical history.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PatientsPage() {
  const { data: patients, error } = await getPatients();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <PatientsPageClient initialPatients={patients || []} />
    </div>
  );
}
