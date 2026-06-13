"use client";

import { Check } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3;
}

const labels = ["Service", "Date & Time", "Your Details"];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const { themeColor } = useWidgetStore();

  return (
    <div className="flex items-center justify-center gap-1 px-6 py-4 shrink-0 bg-white">
      {([1, 2, 3] as const).map((step, idx) => {
        const isPast = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isPast ? "text-white" : isCurrent ? "bg-white text-slate-800" : "text-slate-400 bg-white border-2 border-slate-200"}
                `}
                style={{
                  ...(isPast ? { backgroundColor: themeColor } : {}),
                  ...(isCurrent ? { borderColor: themeColor, borderWidth: '2px' } : {}),
                }}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isPast ? <Check size={14} strokeWidth={3} /> : step}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap mt-1 ${
                  isCurrent || isPast ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {labels[idx]}
              </span>
            </div>

            {/* Connector line */}
            {step < 3 && (
              <div
                className="h-0.5 w-10 mx-2 mb-4 rounded-full transition-all duration-500 bg-slate-200"
              >
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: isPast ? '100%' : '0%',
                    backgroundColor: themeColor 
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
