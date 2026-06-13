"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User, Phone, Mail, CalendarDays, MapPin, AlignLeft } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import { createPatient } from "@/actions/patients";
import { patientSchema, type PatientInput } from "@/lib/validations";

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPatientModal({
  open,
  onOpenChange,
  onSuccess,
}: AddPatientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: null,
      notes: "",
    },
  });

  const onSubmit = async (data: PatientInput) => {
    setIsSubmitting(true);
    try {
      const res = await createPatient({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || null,
        notes: data.notes || null,
      });

      if (res.error) throw new Error(res.error);

      toast.success("Patient added successfully");
      reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to add patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md" className="p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>Enter the details for the new patient record.</DialogDescription>
        </DialogHeader>

        <DialogBody className="p-0 overflow-y-auto">
          <form id="add-patient-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
              <Input
                label="Full Name *"
                placeholder="John Doe"
                leftIcon={<User />}
                error={errors.name?.message}
                {...register("name")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  placeholder="9876543210"
                  leftIcon={<Phone />}
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                <Input
                  label="Email Address"
                  placeholder="john@example.com"
                  type="email"
                  leftIcon={<Mail />}
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Demographics & Notes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date of Birth"
                  type="date"
                  error={errors.dateOfBirth?.message}
                  {...register("dateOfBirth")}
                />
                <Select
                  label="Gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                    { value: "prefer_not_to_say", label: "Prefer not to say" },
                  ]}
                  {...register("gender")}
                />
              </div>
              <div className="relative pt-2">
                <label className="mb-2 block text-sm font-medium text-foreground">Medical Notes</label>
                <div className="relative">
                  <AlignLeft className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    placeholder="Enter any relevant medical history or notes..."
                    className="w-full min-h-[100px] rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    {...register("notes")}
                  />
                </div>
                {errors.notes?.message && (
                  <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>
                )}
              </div>
            </div>

          </form>
        </DialogBody>

        <DialogFooter className="p-6 border-t border-border bg-card shrink-0">
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="add-patient-form" isLoading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
