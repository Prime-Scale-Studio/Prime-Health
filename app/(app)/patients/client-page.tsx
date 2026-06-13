"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Plus, User, Phone, Mail, MapPin, CalendarDays, AlignLeft, Activity, Clock } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SlideOver, SlideOverSection } from "@/components/ui/slide-over";
import { PatientTable } from "@/components/patients/patient-table";
import { AddPatientModal } from "@/components/patients/add-patient-modal";
import { getPatientById, deletePatient, type PatientWithHistory } from "@/actions/patients";
import type { Database } from "@/types/supabase";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

export function PatientsPageClient({
  initialPatients,
}: {
  initialPatients: Patient[];
}) {
  const router = useRouter();
  const [patients, setPatients] = useState(initialPatients);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<PatientWithHistory | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  const handleSuccess = () => {
    router.refresh(); // Ideally we'd use a server action that revalidates, but refresh works for now
  };

  const handleDelete = async (id: string) => {
    const res = await deletePatient(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Patient deleted");
      setPatients(prev => prev.filter(p => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
      router.refresh();
    }
  };

  const handleViewDetails = async (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsPanelLoading(true);
    setPatientDetails(null); // clear old data
    const res = await getPatientById(patient.id);
    if (res.error) {
      toast.error("Failed to load patient history");
      setSelectedPatientId(null);
    } else if (res.data) {
      setPatientDetails(res.data);
    }
    setIsPanelLoading(false);
  };

  return (
    <>
      <PageHeader 
        title="Patients Directory" 
        description="Manage patient records and view their full appointment history."
        breadcrumbs={[{ label: "Patients" }]}
      >
        <Button 
          size="lg" 
          className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Patient
        </Button>
      </PageHeader>

      <div className="flex-1 min-h-0">
        <PatientTable 
          data={patients} 
          onViewDetails={handleViewDetails}
          onDelete={handleDelete}
          onAddPatient={() => setIsAddModalOpen(true)}
        />
      </div>

      <AddPatientModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onSuccess={handleSuccess} 
      />

      {/* SlideOver for Patient Details */}
      <SlideOver
        open={!!selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
        size="md"
      >
        {isPanelLoading ? (
          <div className="p-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="h-px bg-border w-full" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
          </div>
        ) : patientDetails ? (
          <div className="flex flex-col h-full bg-slate-50/50 dark:bg-background">
            {/* Header Profile Info */}
            <div className="px-6 py-8 bg-card border-b border-border shadow-sm shrink-0">
              <div className="flex items-start gap-5">
                <Avatar name={patientDetails.name} size="xl" className="shadow-md ring-4 ring-background" />
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-2xl font-extrabold text-foreground truncate">{patientDetails.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                    {patientDetails.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {patientDetails.phone}</span>
                    )}
                    {patientDetails.email && (
                      <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {patientDetails.email}</span>
                    )}
                    {patientDetails.date_of_birth && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" /> 
                        {format(parseISO(patientDetails.date_of_birth), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Notes */}
            {patientDetails.notes && (
              <SlideOverSection title="Medical Notes" className="bg-card shadow-sm mt-4 border-y border-border">
                <p className="text-sm text-foreground/80 leading-relaxed bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                  {patientDetails.notes}
                </p>
              </SlideOverSection>
            )}

            {/* Timeline */}
            <SlideOverSection title="Appointment History" className="flex-1 overflow-y-auto">
              {patientDetails.appointments?.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No appointments yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">This patient has no history.</p>
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {patientDetails.appointments?.sort((a,b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()).map((appt, i) => {
                    const isCompleted = appt.status === "completed";
                    const isUpcoming = appt.status === "confirmed" || appt.status === "pending";
                    
                    return (
                      <div key={appt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"
                             style={{
                               backgroundColor: isCompleted ? "hsl(var(--emerald-500))" : isUpcoming ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"
                             }}
                        >
                        </div>
                        {/* Content Card */}
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {format(parseISO(appt.appointment_date), "MMM d, yyyy")}
                            </span>
                            <Badge variant={appt.status as any} className="text-[10px] py-0">{appt.status.replace('_', ' ')}</Badge>
                          </div>
                          <h4 className="font-semibold text-foreground">{appt.services?.name ?? "Consultation"}</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {appt.start_time} ({appt.duration_minutes} min)
                          </p>
                          {appt.doctor_notes && (
                            <div className="mt-3 text-xs bg-muted/50 p-2.5 rounded-lg border border-border/50 text-foreground/80 italic">
                              "{appt.doctor_notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SlideOverSection>
          </div>
        ) : null}
      </SlideOver>
    </>
  );
}
