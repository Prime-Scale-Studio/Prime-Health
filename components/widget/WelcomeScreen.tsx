"use client";

import { motion } from "framer-motion";
import { CalendarDays, MessageSquareText, X, Building2 } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";
import { staggerContainer, staggerItem } from "./animations";
import { v4 as uuidv4 } from "uuid";

export function WelcomeScreen() {
  const { setView, clinicName, addMessage, themeColor } = useWidgetStore();

  const handleClose = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "PH_WIDGET_CLOSE" }, "*");
    }
    useWidgetStore.getState().close();
  };

  const handleBookForm = () => {
    setView("form");
  };

  const handleChat = () => {
    const { clinicName: name, doctorName } = useWidgetStore.getState();
    if (useWidgetStore.getState().messages.length === 0) {
      useWidgetStore.setState({ sessionToken: uuidv4() });
      addMessage({
        role: "assistant",
        content: `Hello! I'm the assistant for ${name || "this clinic"}. I can help you book an appointment with ${doctorName || "our doctor"} or answer your questions. How can I help you today?`,
      });
    }
    setView("chat");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Close Button */}
      <div className="flex justify-end p-4 shrink-0">
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-sm"
          aria-label="Close widget"
        >
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 gap-8">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <Building2 size={36} style={{ color: themeColor }} strokeWidth={1.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            How can we help?
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {clinicName ? `Welcome to ${clinicName}` : "Choose an option below"}
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full space-y-3 max-w-sm"
        >
          {/* Option 1 — Book Appointment */}
          <motion.button
            variants={staggerItem}
            onClick={handleBookForm}
            className="group w-full rounded-2xl p-5 bg-white text-left shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 flex items-center gap-4"
            style={{ "--focus-color": themeColor } as any}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
            >
              <CalendarDays size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Book Appointment</p>
              <p className="text-sm text-slate-500 mt-0.5">Schedule in 3 easy steps</p>
            </div>
          </motion.button>

          {/* Option 2 — Talk to Assistant */}
          <motion.button
            variants={staggerItem}
            onClick={handleChat}
            className="group w-full rounded-2xl p-5 bg-white text-left shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 flex items-center gap-4"
            style={{ "--focus-color": themeColor } as any}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
            >
              <MessageSquareText size={24} />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">Talk to Assistant</p>
              <p className="text-sm text-slate-500 mt-0.5">Chat with our AI helper</p>
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
