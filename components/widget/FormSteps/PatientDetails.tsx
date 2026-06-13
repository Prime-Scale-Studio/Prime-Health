"use client";

import { useState, useEffect } from "react";
import { User, Phone, Mail, FileText, Calendar, Clock, Stethoscope, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { useWidgetStore } from "../useWidgetStore";
import { useCustomerRecognition } from "../useCustomerRecognition";
import { PersonalizedGreeting } from "../PersonalizedGreeting";

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

interface PatientDetailsProps {
  onGoToStep: (step: 1 | 2 | 3) => void;
}

export function PatientDetails({ onGoToStep }: PatientDetailsProps) {
  const { formData, updateFormData, customer, themeColor } = useWidgetStore();
  const { recognizeDebounced } = useCustomerRecognition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      updateFormData({
        patientName: customer.name,
        patientEmail: customer.email ?? "",
      });
    }
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    updateFormData({ patientPhone: val });
    if (val.length === 10) {
      recognizeDebounced(val);
    }
    if (errors.patientPhone) setErrors((prev) => ({ ...prev, patientPhone: "" }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ patientName: e.target.value });
    if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: "" }));
  };

  const formattedDate = formData.date
    ? format(new Date(formData.date + "T00:00:00"), "EEE, MMM d yyyy")
    : null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* Returning customer greeting */}
      {customer && (
        <div className="pt-3">
          <PersonalizedGreeting customer={customer} />
        </div>
      )}

      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Your details</h3>
          <p className="text-xs text-slate-500 mt-0.5">We need a few details to confirm your booking</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={formData.patientPhone}
                onChange={handlePhoneChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={`w-full h-11 rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.patientPhone ? "border-red-400 ring-red-400/30" : "focus:border-transparent"}`}
                style={!errors.patientPhone ? { "--tw-ring-color": `${themeColor}60` } as any : {}}
                aria-label="Phone number"
                aria-describedby={errors.patientPhone ? "phone-error" : undefined}
                aria-invalid={!!errors.patientPhone}
              />
            </div>
            {errors.patientPhone && (
              <p id="phone-error" className="mt-1 text-xs text-red-500 font-medium" role="alert">
                {errors.patientPhone}
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.patientName}
                onChange={handleNameChange}
                placeholder="Your full name"
                className={`w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.patientName ? "border-red-400 ring-red-400/30" : "focus:border-transparent"}`}
                style={!errors.patientName ? { "--tw-ring-color": `${themeColor}60` } as any : {}}
                aria-label="Full name"
                aria-invalid={!!errors.patientName}
              />
            </div>
            {errors.patientName && (
              <p className="mt-1 text-xs text-red-500 font-medium" role="alert">{errors.patientName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={formData.patientEmail}
                onChange={(e) => updateFormData({ patientEmail: e.target.value })}
                placeholder="your@email.com"
                className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ "--tw-ring-color": `${themeColor}60` } as any}
                aria-label="Email address"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Any special requests or symptoms..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                style={{ "--tw-ring-color": `${themeColor}60` } as any}
                aria-label="Additional notes"
              />
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div 
          className="rounded-2xl border bg-white p-4 space-y-3 shadow-sm"
          style={{ borderColor: `${themeColor}30` }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Booking Summary</h4>
          </div>

          <div className="space-y-2">
            {formData.serviceName && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Stethoscope size={14} style={{ color: themeColor }} className="shrink-0" />
                  <span className="text-sm font-bold text-slate-800 truncate">{formData.serviceName}</span>
                </div>
                <button
                  onClick={() => onGoToStep(1)}
                  className="hover:opacity-70 shrink-0 transition-opacity"
                  style={{ color: themeColor }}
                  aria-label="Edit service"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}

            {formattedDate && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar size={14} style={{ color: themeColor }} className="shrink-0" />
                  <span className="text-sm font-bold text-slate-800">{formattedDate}</span>
                </div>
                <button
                  onClick={() => onGoToStep(2)}
                  className="hover:opacity-70 shrink-0 transition-opacity"
                  style={{ color: themeColor }}
                  aria-label="Edit date"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}

            {formData.time && (
              <div className="flex items-center gap-2.5">
                <Clock size={14} style={{ color: themeColor }} className="shrink-0" />
                <span className="text-sm font-bold text-slate-800">{formatTime(formData.time)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
