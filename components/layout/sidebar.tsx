"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarCheck2,
  Users, 
  Stethoscope, 
  Settings, 
  MessageSquare,
  BarChart3,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Mic,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Appointments", href: "/appointments", icon: CalendarCheck2 },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Services", href: "/services", icon: Stethoscope },
];

const SECONDARY_NAV = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "AI Settings", href: "/ai-settings", icon: MessageSquare },
  { label: "AI Training", href: "/settings/ai-training", icon: BookOpen },
  { label: "Voice Assistant", href: "/settings/voice", icon: Mic },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative group",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* --- Header / Logo --- */}
      <div className="p-6 h-20 flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group/logo overflow-hidden">
          <div className="min-w-[36px] h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
              Prime<span className="text-primary">Health</span>
            </span>
          )}
        </Link>
      </div>

      {/* --- Collapse Toggle --- */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100 z-50 shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* --- Navigation --- */}
      <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {/* Main Nav */}
        <div className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item relative",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.2)]" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "group-hover/item:scale-110 transition-transform")} />
                  {!isCollapsed && (
                    <span className="text-sm font-semibold whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                      {item.label}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                     <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* System Nav */}
        <div className="space-y-1.5">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 animate-in fade-in duration-500">System</p>
          )}
          {SECONDARY_NAV.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item relative",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-semibold animate-in fade-in slide-in-from-left-2 duration-300">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* --- Footer / User / Banner --- */}
      <div className="p-4 mt-auto space-y-4">
        {!isCollapsed && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-3 relative overflow-hidden group/banner">
            <Sparkles className="absolute -right-2 -top-2 h-12 w-12 text-primary/10 -rotate-12 transition-transform group-hover/banner:scale-125" />
            <div className="text-xs font-bold text-primary tracking-wide flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Pro Feature
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed font-medium">Get advanced AI analysis for your clinic records.</p>
            <Button size="sm" className="w-full h-8 text-[11px] font-bold rounded-lg bg-primary hover:bg-primary/90">Upgrade Now</Button>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group/logout",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={20} className="group-hover/logout:-translate-x-1 transition-transform shrink-0" />
          {!isCollapsed && <span className="text-sm font-semibold">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
