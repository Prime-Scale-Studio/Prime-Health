import React, { useState } from "react";
import { format } from "date-fns";
import { X, Clock, User, Stethoscope, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppointmentWithRelations } from "@/actions/appointments";
import { AddAppointmentModal } from "@/components/appointments/add-appointment-modal";

import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];

interface DaySlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  appointments: AppointmentWithRelations[];
  onAppointmentsChange: () => void;
  services: Service[];
  patients: Patient[];
}

export function DaySlideOver({
  isOpen,
  onClose,
  date,
  appointments,
  onAppointmentsChange,
  services,
  patients,
}: DaySlideOverProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isOpen || !date) return null;

  // Sort appointments by start time
  const sortedAppointments = [...appointments].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );

  const handleAddClick = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (appt: AppointmentWithRelations) => {
    setSelectedAppointment(appt);
    setIsModalOpen(true);
  };

  const formatTime = (time: string) => {
    // time is "HH:mm:ss" or "HH:mm"
    const [h, m] = time.split(":");
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{format(date, "EEEE")}</h2>
            <p className="text-muted-foreground">{format(date, "MMMM d, yyyy")}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{appointments.length} Appointments</h3>
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          {sortedAppointments.length === 0 ? (
            <EmptyState 
              icon={Clock}
              title="No appointments"
              description="There are no appointments scheduled for this day."
              actionLabel="Add Appointment"
              onAction={handleAddClick}
              className="mt-8"
            />
          ) : (
            sortedAppointments.map((appt) => (
              <div 
                key={appt.id}
                onClick={() => handleEditClick(appt)}
                className="bg-background border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                  </div>
                  <Badge variant={appt.status as any}>{appt.status}</Badge>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0">
                      <User className="h-3 w-3" />
                    </div>
                    {appt.patient_name || appt.patients?.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span className="truncate">{appt.service_name || appt.services?.name}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddAppointmentModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false);
          onAppointmentsChange();
        }}
        initialDate={date ? format(date, "yyyy-MM-dd") : undefined}
        services={services}
        patients={patients}
      />
    </>
  );
}
