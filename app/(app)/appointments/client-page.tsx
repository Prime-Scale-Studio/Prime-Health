"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { AddAppointmentModal } from "@/components/appointments/add-appointment-modal";
import { updateAppointmentStatus, deleteAppointment } from "@/actions/appointments";
import type { AppointmentWithRelations } from "@/actions/appointments";
import type { Database } from "@/types/supabase";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Status = Database["public"]["Enums"]["appointment_status"];

export function AppointmentPageClient({
  initialAppointments,
  patients,
  services,
}: {
  initialAppointments: AppointmentWithRelations[];
  patients: Patient[];
  services: Service[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [appointments, setAppointments] = useState(initialAppointments);
  const supabase = createClient();

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    const channel = supabase
      .channel('appointments_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success("New appointment booked");
          } else if (payload.eventType === 'UPDATE') {
            toast.info("Appointment updated");
          } else if (payload.eventType === 'DELETE') {
            toast.info("Appointment removed");
          }
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, toast]);

  const handleStatusChange = async (id: string, newStatus: Status) => {
    // Optimistic UI update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    
    const res = await updateAppointmentStatus(id, newStatus);
    if (res.error) {
      toast.error(res.error);
      // Revert on error
      setAppointments(initialAppointments);
    } else {
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this appointment?")) return;
    
    setAppointments(prev => prev.filter(a => a.id !== id));
    const res = await deleteAppointment(id);
    if (res.error) {
      toast.error(res.error);
      setAppointments(initialAppointments);
    } else {
      toast.success("Appointment deleted");
      router.refresh();
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <PageHeader 
        title="Appointments" 
        description="Manage your bookings, statuses, and daily schedule."
        breadcrumbs={[{ label: "Appointments" }]}
      >
        <Button 
          size="lg" 
          className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          New Appointment
        </Button>
      </PageHeader>

      <div className="flex-1 min-h-0">
        {initialAppointments.length > 0 ? (
          <AppointmentTable 
            data={appointments}
            onStatusChange={handleStatusChange as any}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] rounded-2xl border border-dashed border-border bg-card/50 text-center p-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Plus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No appointments yet</h2>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              You haven't scheduled any appointments yet. Start by adding your first patient booking.
            </p>
            <Button size="lg" onClick={() => setIsAddModalOpen(true)} className="rounded-xl">
              <Plus className="mr-2 h-5 w-5" />
              New Appointment
            </Button>
          </div>
        )}
      </div>

      <AddAppointmentModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        patients={patients} 
        services={services} 
        onSuccess={handleSuccess}
      />
    </>
  );
}
