"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Stethoscope, User, Phone, X, Loader2, CheckCircle2 } from "lucide-react";
import { useWidgetStore } from "./useWidgetStore";
import { bookingCardVariants } from "./animations";
import { useState } from "react";

export function BookingCard() {
  const {
    bookingData,
    isBookingReady,
    bookingComplete,
    themeColor,
    clinicName,
    setBookingComplete,
    confirmBooking
  } = useWidgetStore();

  const [isConfirming, setIsConfirming] = useState(false);

  if (!isBookingReady || bookingComplete || !bookingData) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    await confirmBooking();
    setIsConfirming(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={bookingCardVariants}
        className="mx-2 my-4 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-5 z-30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <h3 className="font-bold text-slate-900 text-[15px]">
              Review Booking
            </h3>
          </div>
          <button
            onClick={() => setBookingComplete(false)}
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all focus-visible:outline-none"
            aria-label="Close"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Date</p>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: themeColor }} />
                <p className="font-bold text-slate-800 text-sm">
                  {formatDate(bookingData.date!)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time</p>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: themeColor }} />
                <p className="font-bold text-slate-800 text-sm">
                  {formatTime(bookingData.time!)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Service</p>
            <div className="flex items-center gap-2">
              <Stethoscope size={14} style={{ color: themeColor }} />
              <p className="font-bold text-slate-800 text-sm">
                {bookingData.serviceName || "Consultation"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Patient</p>
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-500" />
                <p className="font-bold text-slate-800 text-xs truncate">
                  {bookingData.name}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phone</p>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500" />
                <p className="font-bold text-slate-800 text-xs">
                  {bookingData.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full h-12 rounded-xl text-white font-bold text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#10B981',
          }}
        >
          {isConfirming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
             "Confirm Booking"
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
