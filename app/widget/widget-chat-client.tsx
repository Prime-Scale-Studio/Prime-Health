"use client";

import React, { useEffect, useState } from "react";
import { useWidgetStore } from "@/components/widget/useWidgetStore";
import { FloatingButton } from "@/components/widget/FloatingButton";
import { WelcomeScreen } from "@/components/widget/WelcomeScreen";
import { MultiStepForm } from "@/components/widget/MultiStepForm";
import { ChatPanel } from "@/components/widget/ChatPanel";
import { AnimatePresence, motion } from "framer-motion";

interface Clinic {
  id: string;
  name: string;
  doctor_name: string;
  widget_theme_color: string | null;
}

export function WidgetChatClient({ clinic }: { clinic: Clinic }) {
  const { setClinicData, hydrate, isOpen, currentView } = useWidgetStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
    setClinicData({
      clinicId: clinic.id,
      clinicName: clinic.name,
      doctorName: clinic.doctor_name,
      themeColor: clinic.widget_theme_color || "#8B5CF6",
    });

    // FORCE BODY TRANSPARENCY ON MOUNT
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, [clinic, setClinicData, hydrate]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden bg-transparent">
      {/* Main Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, originY: 1, originX: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-24 right-4 w-[calc(100%-32px)] sm:w-[380px] h-[580px] bg-white rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_1px_rgba(0,0,0,0.1)] border border-slate-100 pointer-events-auto"
            style={{ zIndex: 1000 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full h-full flex flex-col"
              >
                {currentView === "welcome" && <WelcomeScreen />}
                {currentView === "form" && <MultiStepForm />}
                {currentView === "chat" && <ChatPanel />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button Container */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <FloatingButton />
      </div>
    </div>
  );
}
