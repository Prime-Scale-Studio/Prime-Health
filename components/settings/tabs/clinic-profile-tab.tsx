"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Save, Upload, Building2, Stethoscope, Globe, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";
import { updateClinicProfile } from "@/actions/clinic";

const profileSchema = z.object({
  name: z.string().min(2, "Clinic name is required"),
  doctor_name: z.string().min(2, "Doctor name is required"),
  specialty: z.string().min(2, "Specialty is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  timezone: z.string().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export function ClinicProfileTab({ initialData }: { initialData: any }) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || "",
      doctor_name: initialData?.doctor_name || "",
      specialty: initialData?.specialty || "",
      description: initialData?.description || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      country: initialData?.country || "India",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      timezone: initialData?.timezone || "Asia/Kolkata",
    },
  });

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    const { error } = await updateClinicProfile(data);
    setIsLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Clinic profile updated successfully");
      reset(data); // Reset isDirty state
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
      <div className="flex items-start gap-4 pb-6 border-b border-border">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Clinic Profile</h2>
          <p className="text-sm text-muted-foreground">
            Basic information about your practice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input 
          label="Clinic Name *" 
          {...register("name")} 
          error={errors.name?.message} 
        />
        <Input 
          label="Doctor Name *" 
          {...register("doctor_name")} 
          error={errors.doctor_name?.message} 
        />
        <Input 
          label="Specialty" 
          leftIcon={<Stethoscope />}
          {...register("specialty")} 
          error={errors.specialty?.message} 
        />
        <Input 
          label="Website URL" 
          type="url" 
          leftIcon={<Globe />}
          {...register("website")} 
          error={errors.website?.message} 
          placeholder="https://"
        />
        <div className="md:col-span-2">
          <Textarea 
            label="Description" 
            {...register("description")} 
            error={errors.description?.message} 
            placeholder="Brief description of your clinic..."
            rows={3}
          />
        </div>
        <Input 
          label="Address" 
          leftIcon={<MapPin />}
          {...register("address")} 
          error={errors.address?.message} 
        />
        <Input 
          label="City" 
          {...register("city")} 
          error={errors.city?.message} 
        />
        <Select 
          label="Country *" 
          {...register("country")} 
          error={errors.country?.message}
          options={[
            { label: "India", value: "India" },
            { label: "United States", value: "US" },
            { label: "United Kingdom", value: "UK" },
            { label: "Canada", value: "Canada" },
            { label: "Australia", value: "Australia" },
          ]}
        />
        <Select 
          label="Timezone *" 
          {...register("timezone")} 
          error={errors.timezone?.message}
          options={[
            { label: "Asia/Kolkata", value: "Asia/Kolkata" },
            { label: "America/New_York", value: "America/New_York" },
            { label: "Europe/London", value: "Europe/London" },
            { label: "Australia/Sydney", value: "Australia/Sydney" },
          ]}
        />
        <Input 
          label="Phone Number" 
          {...register("phone")} 
          error={errors.phone?.message} 
        />
        <Input 
          label="Email Address" 
          type="email" 
          {...register("email")} 
          error={errors.email?.message} 
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" isLoading={isLoading} disabled={!isDirty}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </form>
  );
}
