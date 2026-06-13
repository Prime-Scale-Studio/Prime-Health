import React from "react";
import { getServices } from "@/actions/services";
import { ServicesPageClient } from "./client-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Prime Health",
  description: "Configure your clinic's services and pricing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ServicesPage() {
  const { data: services, error } = await getServices();

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <ServicesPageClient initialServices={services || []} />
    </div>
  );
}
