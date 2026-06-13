import React from "react";
import { getAnalytics } from "@/actions/analytics";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Prime Health",
  description: "View your clinic's performance and appointment trends.",
};

export default async function AnalyticsPage() {
  const { data } = await getAnalytics("30d");

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <AnalyticsClient initialData={data} />
    </div>
  );
}
