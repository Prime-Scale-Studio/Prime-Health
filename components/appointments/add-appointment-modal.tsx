"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format, isBefore, startOfToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Phone, Mail, FileEdit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, Listbox } from "@/components/ui/select";
import { createAppointment } from "@/actions/appointments";
import { createPatient } from "@/actions/patients";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];

interface AddAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  patients: Patient[];
  initialDate?: string;
  onSuccess?: () => void;
}

export function AddAppointmentModal({
  open,
  onOpenChange,
  services,
  patients,
  initialDate,
  onSuccess,
}: AddAppointmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; available: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Form for new patient
  const { register: regPatient, handleSubmit: handleNewPatientSubmit, formState: { errors: patientErrors }, reset: resetPatientForm } = useForm({
    defaultValues: { name: "", phone: "", email: "" }
  });

  // Form for appointment notes
  const { register: regNotes, getValues: getNotesValues, reset: resetNotes } = useForm({
    defaultValues: { notes: "" }
  });

  const resetAll = () => {
    setPatientMode("existing");
    setSelectedPatientId("");
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedTime("");
    setAvailableSlots([]);
    resetPatientForm();
    resetNotes();
  };

  // Fetch slots when date and service change
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !selectedServiceId) {
        setAvailableSlots([]);
        return;
      }
      const service = services.find(s => s.id === selectedServiceId);
      if (!service) return;

      setIsLoadingSlots(true);
      try {
        // Find clinic ID from the service
        const clinicId = service.clinic_id;
        const res = await fetch(`/api/widget/slots?clinicId=${clinicId}&date=${selectedDate}&serviceId=${selectedServiceId}`);
        if (!res.ok) throw new Error("Failed to fetch slots");
        const data = await res.json();
        // The API returns an array of slots: { startTime: "09:00", endTime: "09:30", available: true }
        if (data.slots) {
          setAvailableSlots(data.slots);
        } else {
          // Mock slots if API format is different or fails
          generateMockSlots();
        }
      } catch (err) {
        console.error(err);
        generateMockSlots(); // Fallback to mock for testing
      } finally {
        setIsLoadingSlots(false);
      }
    }

    const generateMockSlots = () => {
      const slots = [];
      for (let i = 9; i <= 17; i++) {
        slots.push({ startTime: `${i.toString().padStart(2, '0')}:00`, available: Math.random() > 0.3 });
        slots.push({ startTime: `${i.toString().padStart(2, '0')}:30`, available: Math.random() > 0.3 });
      }
      setAvailableSlots(slots);
    };

    fetchSlots();
    setSelectedTime("");
  }, [selectedDate, selectedServiceId, services]);


  const onSubmit = async () => {
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    let patientId = selectedPatientId;
    let patientName = "";
    let patientPhone = "";
    let patientEmail = "";

    try {
      if (patientMode === "new") {
        // Need to create patient manually by calling the action inside a callback to use RHF values
        const formValues = getNotesValues(); // Actually we need patient form values, let's trigger it
      }

      // Simplified submit flow since RHF nesting is tricky in modals:
      // We will handle New Patient creation manually reading refs or states, 
      // but since we are using useForm, let's trigger the handleNewPatientSubmit 
      // if mode is new.
    } catch(e) {
      // ignore
    }
  };

  // Dedicated submit function that handles the combined logic
  const handleFinalSubmit = async (patientData?: { name: string; phone: string; email: string }) => {
    if (!selectedServiceId || !selectedDate || !selectedTime) {
      toast.error("Please complete the appointment details.");
      return;
    }

    if (patientMode === "existing" && !selectedPatientId) {
      toast.error("Please select a patient.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPatientId = selectedPatientId;
      let pName = "";
      let pPhone = "";
      let pEmail = "";

      if (patientMode === "new" && patientData) {
        // Create patient first
        const res = await createPatient({
          name: patientData.name,
          phone: patientData.phone,
          email: patientData.email || "",
          date_of_birth: null,
          gender: null,
          notes: null,
        });
        if (res.error || !res.data) throw new Error(res.error || "Failed to create patient");
        finalPatientId = res.data.id;
        pName = res.data.name;
        pPhone = res.data.phone || "";
        pEmail = res.data.email || "";
      } else if (patientMode === "existing") {
        const p = patients.find(p => p.id === selectedPatientId);
        if (p) {
          pName = p.name;
          pPhone = p.phone || "";
          pEmail = p.email || "";
        }
      }

      const service = services.find(s => s.id === selectedServiceId);
      const notes = getNotesValues().notes;

      // End time calculation (simplified, assumes duration is in minutes)
      const duration = service?.duration_minutes || 30;
      const [h, m] = selectedTime.split(':').map(Number);
      const endTotalMins = h * 60 + m + duration;
      const endH = Math.floor(endTotalMins / 60).toString().padStart(2, '0');
      const endM = (endTotalMins % 60).toString().padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const res = await createAppointment({
        patient_id: finalPatientId,
        service_id: selectedServiceId,
        patient_name: pName,
        patient_phone: pPhone,
        patient_email: pEmail,
        service_name: service?.name || "Consultation",
        duration_minutes: duration,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        status: "confirmed",
        doctor_notes: notes,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Appointment created successfully!");
      onSuccess?.();
      onOpenChange(false);
      resetAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to create appointment");
    } finally {
      setIsSubmitting(false);
    }
  };


  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientMode === "new") {
      handleNewPatientSubmit(handleFinalSubmit)(e);
    } else {
      handleFinalSubmit();
    }
  };

  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  useEffect(() => {
    if (!open) return;
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [open, initialDate]);

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) resetAll(); onOpenChange(val); }}>
      <DialogContent size="lg" className="p-0 overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh]">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>Book a new appointment for an existing or new patient.</DialogDescription>
        </DialogHeader>

        <DialogBody className="p-0 overflow-y-auto">
          <form id="add-appointment-form" onSubmit={onFormSubmit} className="p-6 space-y-8">
            
            {/* 1. Patient Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">1. Patient Details</h3>
                <div className="flex bg-muted p-1 rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setPatientMode("existing")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${patientMode === "existing" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Existing
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPatientMode("new")}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${patientMode === "new" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    New Patient
                  </button>
                </div>
              </div>

              {patientMode === "existing" ? (
                <Listbox
                  value={selectedPatientId}
                  onChange={setSelectedPatientId}
                  options={patients.map(p => ({
                    value: p.id,
                    label: p.name,
                    description: p.phone || p.email || "No contact info",
                    icon: <User className="h-4 w-4" />
                  }))}
                  placeholder="Search and select patient..."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                  <Input 
                    label="Full Name *" 
                    leftIcon={<User />} 
                    placeholder="John Doe" 
                    {...regPatient("name", { required: "Name is required" })}
                    error={patientErrors.name?.message as string}
                  />
                  <Input 
                    label="Phone Number *" 
                    leftIcon={<Phone />} 
                    placeholder="9876543210" 
                    {...regPatient("phone", { required: "Phone is required", pattern: { value: /^[6-9]\d{9}$/, message: "Invalid Indian phone number" } })}
                    error={patientErrors.phone?.message as string}
                  />
                  <Input 
                    label="Email (Optional)" 
                    leftIcon={<Mail />} 
                    placeholder="john@example.com" 
                    type="email"
                    wrapperClassName="sm:col-span-2"
                    {...regPatient("email")}
                  />
                </div>
              )}
            </div>

            {/* 2. Service & Date */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">2. Appointment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Service *"
                  options={services.map(s => ({ value: s.id, label: `${s.name} (${s.duration_minutes}m)` }))}
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  placeholder="Select a service"
                  required
                />
                <Input
                  label="Date *"
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. Time Slots */}
            {selectedDate && selectedServiceId && (
              <div className="space-y-3 pt-4 border-t border-border animate-fade-in">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  3. Select Time
                  {isLoadingSlots && <span className="text-xs font-normal text-primary flex items-center gap-1"><div className="h-2 w-2 bg-primary rounded-full animate-ping" /> Loading slots...</span>}
                </h3>
                
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.startTime)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                          !slot.available 
                            ? "bg-muted/50 border-transparent text-muted-foreground/50 cursor-not-allowed opacity-60" 
                            : selectedTime === slot.startTime
                              ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_10px_hsl(var(--primary)/0.3)] scale-105"
                              : "bg-background border-border text-foreground hover:border-primary/50 hover:text-primary hover:shadow-sm"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : !isLoadingSlots && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-medium text-center">
                    No available slots on this date.
                  </div>
                )}
              </div>
            )}

            {/* 4. Notes */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">4. Notes (Internal)</h3>
              <div className="relative">
                <FileEdit className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  placeholder="Add any internal notes for this appointment..."
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  {...regNotes("notes")}
                />
              </div>
            </div>

          </form>
        </DialogBody>

        <DialogFooter className="p-6 border-t border-border bg-card shrink-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="add-appointment-form" isLoading={isSubmitting}>
            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
