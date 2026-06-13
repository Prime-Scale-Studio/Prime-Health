"use client";

import { useEffect, useState } from "react";
import { Check, Clock, IndianRupee, Stethoscope } from "lucide-react";
import { useWidgetStore } from "../useWidgetStore";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  currency: string;
}

export function ServiceSelection() {
  const { clinicId, formData, updateFormData, themeColor } = useWidgetStore();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/widget/clinic?clinicId=${clinicId}`);
        if (!res.ok) throw new Error("Failed to load services");

        const svcRes = await fetch(`/api/widget/services?clinicId=${clinicId}`);
        if (svcRes.ok) {
          const data = await svcRes.json() as { services: Service[] };
          setServices(data.services ?? []);
        } else {
          setError("Unable to load services. Please try the AI chat instead.");
        }
      } catch {
        setError("Unable to load services. Please try the AI chat instead.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [clinicId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto bg-slate-50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center bg-slate-50">
        <div>
          <Stethoscope size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
      <div className="mb-2">
        <h3 className="text-base font-bold text-slate-900">What service do you need?</h3>
        <p className="text-xs text-slate-500 mt-0.5">Select the type of appointment</p>
      </div>

      {services.map((service) => {
        const isSelected = formData.serviceId === service.id;
        return (
          <button
            key={service.id}
            onClick={() =>
              updateFormData({
                serviceId: service.id,
                serviceName: service.name,
                serviceDuration: service.duration_minutes,
              })
            }
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 focus-visible:outline-none ${
              isSelected
                ? "bg-white shadow-sm"
                : "border-transparent bg-white hover:border-slate-200 shadow-sm"
            }`}
            style={{
              ...(isSelected ? { borderColor: themeColor } : {}),
            }}
            aria-pressed={isSelected}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isSelected ? "text-white" : ""
                  }`}
                  style={{
                    ...(isSelected 
                      ? { backgroundColor: themeColor } 
                      : { backgroundColor: `${themeColor}15`, color: themeColor }),
                  }}
                >
                  <Stethoscope size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <Clock size={11} />
                      {service.duration_minutes} min
                    </span>
                    {service.price !== null && service.price > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-slate-400 font-medium">
                        <IndianRupee size={11} />
                        {service.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isSelected && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
