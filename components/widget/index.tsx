"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingButton } from "./FloatingButton";
import { ChatPanel } from "./ChatPanel";
import { WelcomeScreen } from "./WelcomeScreen";
import { MultiStepForm } from "./MultiStepForm";
import { useWidgetStore } from "./useWidgetStore";
import { panelVariants } from "./animations";

export function Widget({ clinicId }: { clinicId: string }) {
  const { setClinicData, hydrate, isOpen, currentView } = useWidgetStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    hydrate(); // Hydrate state from localStorage
    
    const loadClinicData = async () => {
      try {
        const response = await fetch(`/api/widget/clinic?clinicId=${clinicId}`);
        if (response.ok) {
          const data = await response.json();
          setClinicData({
            clinicId: data.id,
            clinicName: data.name,
            doctorName: data.doctor_name,
            themeColor: data.widget_theme_color || "#8B5CF6",
          });
        }
      } catch (error) {
        console.error("Failed to load clinic data:", error);
      }
    };

    if (clinicId) {
      loadClinicData();
    }
  }, [clinicId, setClinicData, hydrate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <FloatingButton />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-[9998] bg-white overflow-hidden shadow-[0_20px_60px_rgba(139,92,246,0.3)]
              ${isMobile 
                ? "inset-0 w-screen h-screen rounded-none" 
                : "bottom-24 right-5 w-[420px] h-[680px] rounded-2xl"
              }
            `}
          >
            {currentView === "welcome" && <WelcomeScreen />}
            {currentView === "form" && <MultiStepForm />}
            {currentView === "chat" && <ChatPanel />}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export * from "./FloatingButton";
export * from "./ChatPanel";
export * from "./ChatHeader";
export * from "./MessageList";
export * from "./MessageBubble";
export * from "./QuickActions";
export * from "./BookingCard";
export * from "./ChatInput";
export * from "./TypingIndicator";
export * from "./useWidgetStore";
export * from "./animations";
export * from "./WelcomeScreen";
export * from "./MultiStepForm";
export * from "./ProgressIndicator";
export * from "./PersonalizedGreeting";
export * from "./useCustomerRecognition";
