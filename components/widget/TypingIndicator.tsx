"use client";

import { useWidgetStore } from "./useWidgetStore";

export function TypingIndicator() {
  const { themeColor } = useWidgetStore();

  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 text-white shadow-sm"
          style={{ backgroundColor: themeColor }}
          aria-hidden="true"
        >
          <span className="text-[9px] font-bold">AI</span>
        </div>
        <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1.5 items-center">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" 
            style={{ backgroundColor: themeColor }}
          />
          <div 
            className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" 
            style={{ backgroundColor: themeColor, opacity: 0.6 }}
          />
          <div 
            className="w-1.5 h-1.5 rounded-full animate-bounce" 
            style={{ backgroundColor: themeColor, opacity: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
