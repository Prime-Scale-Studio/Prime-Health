import React from "react";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
