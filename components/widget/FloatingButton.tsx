"use client";

import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";

export function FloatingButton() {
  const { isOpen, open, close, themeColor } = useWidgetStore();

  return (
    <motion.button
      onClick={isOpen ? close : open}
      className="relative w-16 h-16 rounded-full text-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex items-center justify-center z-[9999] focus-visible:outline-none transition-all hover:scale-105 active:scale-95 border-2 border-white"
      style={{
        backgroundColor: themeColor || "#8B5CF6", // Fallback color
        willChange: "transform",
      }}
      aria-label={isOpen ? "Close booking widget" : "Open booking widget"}
    >
      <motion.span
        initial={{ y: 0 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ delay: 3, duration: 0.4, ease: "easeInOut" }}
        className="flex items-center justify-center"
      >
        <MessageSquareText size={24} strokeWidth={2.5} />
      </motion.span>

      {/* Notification Pop-up Badge */}
      {!isOpen && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm border-2 border-white"
          aria-hidden="true"
        >
          1
        </motion.span>
      )}
    </motion.button>
  );
}
