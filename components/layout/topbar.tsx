"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Moon, 
  Sun,
  ShieldCheck,
  CircleHelp,
  Menu,
  Activity,
  LayoutDashboard,
  Calendar,
  CalendarCheck2,
  Users,
  Stethoscope,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { useTheme } from "next-themes";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { SlideOver } from "@/components/ui/slide-over";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Topbar() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      if (userData.user?.id) {
        const { data } = await supabase
          .from("appointments")
          .select("id, patient_name, appointment_date, start_time, created_at, status")
          .eq("clinic_id", userData.user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data) setNotifications(data);
      }
    };
    fetchUserAndNotifications();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const doctorName = user?.user_metadata?.doctor_name || "Doctor";
  const clinicName = user?.user_metadata?.name || "Prime Health Clinic";

  return (
    <header className="h-20 border-b border-border/40 px-6 md:px-8 flex items-center justify-between glass sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden rounded-xl text-muted-foreground"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <Menu size={24} />
        </Button>

        {/* --- Search Bar --- */}
        <div className="flex-1 max-w-md hidden md:block">
          <Input 
            placeholder="Search patients, appointments, records..." 
            leftIcon={<Search className="h-4 w-4" />}
            className="h-10 bg-muted/50 border-transparent focus:bg-background transition-all"
            wrapperClassName="w-full"
            aria-label="Search"
          />
        </div>
      </div>

      {/* --- Actions --- */}
      <div className="flex items-center gap-3">
        
        {/* Help */}
        <Tooltip content="Documentation & Support">
          <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl" aria-label="Help">
            <CircleHelp size={20} />
          </Button>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground rounded-xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </Tooltip>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground rounded-xl relative" aria-label="View notifications">
              <Bell size={20} />
              {notifications.length > 0 && (
                 <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
               <h4 className="font-bold flex items-center justify-between text-sm">
                 Notifications
                 {notifications.length > 0 && (
                   <Badge variant="secondary" className="text-[10px]">{notifications.length} New</Badge>
                 )}
               </h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No recent notifications.</div>
              ) : (
                notifications.map((notif) => {
                  const dateStr = notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : 'Recently';
                  return (
                    <DropdownMenuItem key={notif.id} className="p-4 flex gap-4 cursor-pointer hover:bg-muted/50 border-b border-border last:border-0 rounded-none focus:bg-muted/50">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CalendarCheck2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold leading-none capitalize">{notif.status} Appointment</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {notif.patient_name} for {notif.appointment_date} at {notif.start_time.substring(0, 5)}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium pt-1">{dateStr}</p>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </div>
            <div className="p-2 bg-muted/10">
               <Link href="/appointments" passHref>
                 <Button variant="ghost" className="w-full text-xs font-bold text-primary">View all appointments</Button>
               </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border mx-1" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-muted/50 transition-all focus:outline-none group"
              aria-label="User menu"
            >
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{doctorName}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{clinicName}</p>
               </div>
               <Avatar name={doctorName} size="md" ring className="group-hover:scale-105 transition-transform" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem icon={<User />}>My Profile</DropdownMenuItem>
            </Link>
            <DropdownMenuItem icon={<ShieldCheck />}>Privacy Settings</DropdownMenuItem>
            <Link href="/settings">
              <DropdownMenuItem icon={<Settings />}>Clinic Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem icon={<LogOut />} destructive onClick={handleLogout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Nav SlideOver */}
      <SlideOver
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        size="sm"
        title={
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" strokeWidth={2.5} />
            <span>Prime<span className="text-primary">Health</span></span>
          </div>
        }
      >
        <div className="px-4 py-6 space-y-8">
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">Main Menu</p>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                  )}>
                    <Icon size={20} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-4 border-t border-border">
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">System</p>
            {SECONDARY_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent"
                  )}>
                    <Icon size={20} />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="pt-8">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive gap-3 px-4 py-6 rounded-xl" onClick={handleLogout}>
              <LogOut size={20} />
              <span className="text-sm font-semibold">Sign Out</span>
            </Button>
          </div>
        </div>
      </SlideOver>
    </header>
  );
}
