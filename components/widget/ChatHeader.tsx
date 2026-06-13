"use client";

import { X, Bot, ChevronLeft } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";

export function ChatHeader() {
  const { clinicName, doctorName, setView, themeColor } = useWidgetStore();

  // Works both in standalone mode and embedded iframe mode
  const handleClose = () => {
    // Tell parent frame to close the bubble (embedded mode)
    if (window.parent !== window) {
      window.parent.postMessage({ type: "PH_WIDGET_CLOSE" }, "*");
    }
    // Also close internal state
    useWidgetStore.getState().close();
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 text-white shrink-0 shadow-sm"
      style={{ backgroundColor: themeColor }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30 shrink-0">
          <Bot size={18} />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight">{clinicName ?? "AI Assistant"}</h2>
          <p className="text-[11px] opacity-80 mt-0.5">
            {doctorName ? `Dr. ${doctorName} · ` : ""}Online · Replies instantly
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setView("welcome")}
          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Back to menu"
        >
          <ChevronLeft size={14} />
          Menu
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Close widget"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
