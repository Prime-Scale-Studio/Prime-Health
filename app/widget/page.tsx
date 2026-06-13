import React from "react";
import { WidgetChatClient } from "./widget-chat-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Schedule your appointment with our AI assistant.",
};

export default async function WidgetPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await props.searchParams;
  const clinicId = resolvedSearchParams.clinicId as string | undefined;

  if (!clinicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl max-w-sm text-center">
          <h2 className="text-xl font-bold text-foreground">Invalid Clinic</h2>
          <p className="text-muted-foreground mt-2">
            The booking link is invalid or missing the clinic identifier.
          </p>
        </div>
      </div>
    );
  }

  // Use public API instead of server client
  let clinic = null;
  try {
    // In server components, fetch needs absolute URLs if hitting our own API,
    // or we can just use the public admin client directly here since it's a server component.
    // However, the prompt specifically asked NOT to use createClient from server.ts
    // Let's use fetch with a relative URL trick or use NEXT_PUBLIC_APP_URL.
    // Given Next.js app router, fetching absolute URL is safest.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/widget/clinic?clinicId=${clinicId}`, { cache: 'no-store' });
    if (res.ok) {
      clinic = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch clinic info", e);
  }

  if (!clinic || clinic.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <div className="bg-card border border-border shadow-sm p-6 rounded-2xl max-w-sm text-center">
          <h2 className="text-xl font-bold text-foreground">Clinic Not Found</h2>
          <p className="text-muted-foreground mt-2">
            We couldn't find a clinic matching this identifier.
          </p>
        </div>
      </div>
    );
  }

  return (
    // Transparent — only the widget bubble/panel will be visible when embedded as an iframe
    <div style={{ background: "transparent" }}>
      <WidgetChatClient clinic={clinic} />
    </div>
  );
}
