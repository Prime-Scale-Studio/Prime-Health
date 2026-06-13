"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, X } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";
import { ProgressIndicator } from "./ProgressIndicator";
import { ServiceSelection } from "./FormSteps/ServiceSelection";
import { DateTimeSelection } from "./FormSteps/DateTimeSelection";
import { PatientDetails } from "./FormSteps/PatientDetails";
import { viewVariants } from "./animations";
import { toast } from "sonner";

export function MultiStepForm() {
  const {
    setView,
    formStep,
    setFormStep,
    nextFormStep,
    prevFormStep,
    formData,
    submitForm,
    isSubmittingForm,
    formBookingSuccess,
    resetForm,
    themeColor
  } = useWidgetStore();

  const handleClose = () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "PH_WIDGET_CLOSE" }, "*");
    }
    useWidgetStore.getState().close();
  };

  const handleBack = () => {
    if (formStep === 1) {
      setView("welcome");
    } else {
      prevFormStep();
    }
  };

  const handleGoToStep = (step: 1 | 2 | 3) => {
    setFormStep(step);
  };

  const canProceedStep1 = !!formData.serviceId;
  const canProceedStep2 = !!formData.date && !!formData.time;
  const canProceedStep3 =
    formData.patientName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(formData.patientPhone);

  const canProceed =
    formStep === 1 ? canProceedStep1
    : formStep === 2 ? canProceedStep2
    : canProceedStep3;

  const handleNext = async () => {
    if (formStep < 3) {
      nextFormStep();
    } else {
      try {
        await submitForm();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to book appointment";
        toast.error(message);
      }
    }
  };

  const stepTitles = ["Select Service", "Date & Time", "Your Details"];

  if (formBookingSuccess) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-white">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 text-white shadow-lg"
          style={{ backgroundColor: '#10B981' }}
        >
          <CheckCircle2 size={40} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            You'll receive a confirmation shortly.
          </p>
          <button
            onClick={() => {
              resetForm();
              setView("welcome");
            }}
            className="mt-10 px-8 py-3.5 rounded-2xl text-white text-sm font-bold shadow-md hover:opacity-90 transition-all active:scale-95"
            style={{ backgroundColor: themeColor }}
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 bg-white">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-[13px] font-bold transition-opacity hover:opacity-70 focus-visible:outline-none"
          style={{ color: themeColor }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          Back
        </button>
        <span className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">
          {stepTitles[formStep - 1]}
        </span>
        <button
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 flex items-center justify-center transition-colors"
          aria-label="Close widget"
        >
          <X size={16} className="text-slate-500" />
        </button>
      </div>

      {/* Progress */}
      <ProgressIndicator currentStep={formStep} />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={formStep}
          variants={viewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
          {formStep === 1 && <ServiceSelection />}
          {formStep === 2 && <DateTimeSelection />}
          {formStep === 3 && <PatientDetails onGoToStep={handleGoToStep} />}
        </motion.div>
      </AnimatePresence>

      {/* Footer Button */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-white">
        <button
          onClick={handleNext}
          disabled={!canProceed || isSubmittingForm}
          className={`w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none ${
            !canProceed
              ? "bg-slate-100 text-slate-300 cursor-not-allowed"
              : "shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98]"
          }`}
          style={
            canProceed && !isSubmittingForm
              ? { backgroundColor: formStep === 3 ? '#10B981' : themeColor }
              : undefined
          }
        >
          {isSubmittingForm ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing...
            </>
          ) : formStep === 3 ? (
            <>
              <Check size={20} strokeWidth={3} />
              Confirm Booking
            </>
          ) : (
            <>
              Continue
              <ArrowRight size={20} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
