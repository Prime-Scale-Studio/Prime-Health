"use client";

import { motion } from "framer-motion";
import { UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { CustomerInfo } from "./useWidgetStore";
import { greetingVariants } from "./animations";
import { useWidgetStore } from "./useWidgetStore";

interface PersonalizedGreetingProps {
  customer: CustomerInfo;
}

export function PersonalizedGreeting({ customer }: PersonalizedGreetingProps) {
  const { themeColor } = useWidgetStore();

  const lastVisitFormatted = customer.lastVisit
    ? format(new Date(customer.lastVisit), "MMM d, yyyy")
    : null;

  return (
    <motion.div
      variants={greetingVariants}
      initial="hidden"
      animate="visible"
      className="mx-4 mb-3 rounded-xl p-3 flex items-center gap-3 border"
      style={{ 
        backgroundColor: `${themeColor}08`,
        borderColor: `${themeColor}20` 
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm"
        style={{ backgroundColor: themeColor }}
      >
        <UserCircle2 size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">
          👋 Welcome back, {customer.name}!
        </p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {lastVisitFormatted
            ? `Last visit: ${lastVisitFormatted} · ${customer.totalAppointments} visits`
            : `${customer.totalAppointments} previous visit${customer.totalAppointments !== 1 ? "s" : ""}`}
        </p>
      </div>
    </motion.div>
  );
}
