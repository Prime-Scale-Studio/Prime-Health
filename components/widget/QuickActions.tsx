"use client";

import { useWidgetStore } from "./useWidgetStore";

interface QuickAction {
  label: string;
  message: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "📅 Book appointment", message: "I'd like to book an appointment" },
  { label: "🕐 Working hours", message: "What are your working hours?" },
  { label: "💊 Services", message: "What services do you offer?" },
  { label: "📍 Location", message: "Where are you located?" },
];

interface QuickActionsProps {
  onSelect: (message: string) => void;
}

export function QuickActions({ onSelect }: QuickActionsProps) {
  const { themeColor } = useWidgetStore();

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 shrink-0 bg-white">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.message)}
          className="px-4 py-2 rounded-full text-[12px] font-bold border transition-all hover:shadow-sm active:scale-95 whitespace-nowrap"
          style={{ 
            borderColor: `${themeColor}30`, 
            color: themeColor,
            backgroundColor: `${themeColor}08`
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
