"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, IndianRupee, FileText, Stethoscope } from "lucide-react";
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
import { createService, updateService } from "@/actions/services";
import { serviceSchema, type ServiceInput } from "@/lib/validations";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceToEdit?: Service | null;
  onSuccess?: () => void;
}

export function AddServiceModal({
  open,
  onOpenChange,
  serviceToEdit,
  onSuccess,
}: AddServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_minutes: 30,
      price: 0,
    },
  });

  useEffect(() => {
    if (serviceToEdit && open) {
      reset({
        name: serviceToEdit.name,
        description: serviceToEdit.description || "",
        duration_minutes: serviceToEdit.duration_minutes,
        price: serviceToEdit.price || 0,
      });
    } else if (!open) {
      reset({
        name: "",
        description: "",
        duration_minutes: 30,
        price: 0,
      });
    }
  }, [serviceToEdit, open, reset]);

  const onSubmit = async (data: ServiceInput) => {
    setIsSubmitting(true);
    try {
      if (serviceToEdit) {
        const res = await updateService(serviceToEdit.id, {
          name: data.name,
          description: data.description || null,
          duration_minutes: data.duration_minutes,
          price: data.price || null,
        } as any); // using any for pick types shorthand
        if (res.error) throw new Error(res.error);
        toast.success("Service updated successfully");
      } else {
        const res = await createService({
          name: data.name,
          description: data.description || null,
          duration_minutes: data.duration_minutes,
          price: data.price || null,
        } as any);
        if (res.error) throw new Error(res.error);
        toast.success("Service created successfully");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm" className="p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 border-b border-border bg-muted/20 shrink-0">
          <DialogTitle>{serviceToEdit ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {serviceToEdit 
              ? "Update the details for this service offering." 
              : "Create a new service offering for your patients to book."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="p-0 overflow-y-auto">
          <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            <Input
              label="Service Name *"
              placeholder="e.g., General Consultation"
              leftIcon={<Stethoscope />}
              error={errors.name?.message}
              {...register("name")}
            />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Duration (minutes) *
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="30"
                  leftIcon={<Clock />}
                  className="w-full"
                  error={errors.duration_minutes?.message}
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
              </div>
              {/* Presets */}
              <div className="flex gap-2 pt-1">
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setValue("duration_minutes", mins, { shouldValidate: true })}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Price (₹)"
              type="number"
              placeholder="500"
              leftIcon={<IndianRupee />}
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />

            <div className="relative pt-2">
              <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
              <div className="relative">
                <FileText className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  placeholder="Briefly describe what this service includes..."
                  className="w-full min-h-[80px] rounded-xl border border-input bg-background pl-9 pr-4 py-2.5 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  {...register("description")}
                />
              </div>
              {errors.description?.message && (
                <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

          </form>
        </DialogBody>

        <DialogFooter className="p-6 border-t border-border bg-card shrink-0">
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="service-form" isLoading={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
