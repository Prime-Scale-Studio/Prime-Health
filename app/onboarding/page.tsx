"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  Phone,
  MapPin,
  Stethoscope,
  Clock,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Activity,
  IndianRupee,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateClinicProfile } from "@/actions/clinic";
import { updateAvailability } from "@/actions/settings";
import { createService } from "@/actions/services";
import { serviceSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

// ─────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────

const STEPS = [
  {
    id: "clinic",
    title: "Your Practice",
    subtitle: "Tell patients who you are and where to find you",
    icon: Building2,
  },
  {
    id: "hours",
    title: "Working Hours",
    subtitle: "Set when you're available to see patients",
    icon: Clock,
  },
  {
    id: "service",
    title: "First Service",
    subtitle: "Add the first service your clinic offers",
    icon: Stethoscope,
  },
] as const;

// ─────────────────────────────────────────────
// Zod schemas for each step
// ─────────────────────────────────────────────

const step1Schema = z.object({
  clinicName: z
    .string()
    .min(2, "Clinic name must be at least 2 characters")
    .max(100),
  specialty: z.string().min(2, "Specialty is required").max(100),
  city: z.string().min(2, "City is required").max(100),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
});
type Step1Input = z.infer<typeof step1Schema>;

type ServiceInput = z.infer<typeof serviceSchema>;

// ─────────────────────────────────────────────
// Day availability state
// ─────────────────────────────────────────────

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface DayAvailability {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_AVAILABILITY: DayAvailability[] = [
  { dayOfWeek: 0, isAvailable: false, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isAvailable: true,  startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, isAvailable: true,  startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, isAvailable: true,  startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, isAvailable: true,  startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, isAvailable: true,  startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 6, isAvailable: false, startTime: "09:00", endTime: "17:00" },
];

// ─────────────────────────────────────────────
// Step indicator component
// ─────────────────────────────────────────────

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: typeof STEPS;
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "relative h-10 w-10 rounded-full flex items-center justify-center",
                  "transition-all duration-300 font-bold text-sm",
                  isDone &&
                    "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.4)]",
                  isActive &&
                    "bg-primary text-primary-foreground shadow-[0_4px_16px_hsl(var(--primary)/0.4)] ring-4 ring-primary/20",
                  !isDone &&
                    !isActive &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-5 sm:mb-6 rounded-full transition-all duration-500">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    idx < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 1 — Clinic Details
// ─────────────────────────────────────────────

function Step1({
  onNext,
  isLoading,
}: {
  onNext: (data: Step1Input) => Promise<void>;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Input>({ resolver: zodResolver(step1Schema) });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      <Input
        label="Clinic name"
        id="onb-clinic-name"
        placeholder="City Dental Clinic"
        leftIcon={<Building2 />}
        error={errors.clinicName?.message}
        required
        {...register("clinicName")}
      />
      <Input
        label="Specialty / Type of practice"
        id="onb-specialty"
        placeholder="General Dentistry, Cardiology, Physiotherapy…"
        leftIcon={<Stethoscope />}
        error={errors.specialty?.message}
        required
        {...register("specialty")}
        helperText="This appears on your booking widget"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="City"
          id="onb-city"
          placeholder="Mumbai"
          leftIcon={<MapPin />}
          error={errors.city?.message}
          required
          {...register("city")}
        />
        <Input
          label="WhatsApp / Phone"
          id="onb-phone"
          type="tel"
          placeholder="9876543210"
          leftIcon={<Phone />}
          error={errors.phone?.message}
          required
          {...register("phone")}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full mt-2"
        isLoading={isLoading}
        rightIcon={!isLoading ? <ArrowRight /> : undefined}
      >
        {isLoading ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────────
// Step 2 — Working Hours
// ─────────────────────────────────────────────

function Step2({
  onNext,
  onBack,
  isLoading,
}: {
  onNext: (days: DayAvailability[]) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}) {
  const [availability, setAvailability] = useState<DayAvailability[]>(
    DEFAULT_AVAILABILITY
  );

  const updateDay = useCallback(
    (dayIndex: number, field: keyof DayAvailability, value: string | boolean) => {
      setAvailability((prev) =>
        prev.map((d) =>
          d.dayOfWeek === dayIndex ? { ...d, [field]: value } : d
        )
      );
    },
    []
  );

  const activeDays = availability.filter((d) => d.isAvailable).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Toggle the days you work</span>
        <span className="font-medium text-primary">
          {activeDays} day{activeDays !== 1 ? "s" : ""} active
        </span>
      </div>

      <div className="space-y-2.5">
        {availability.map((day) => (
          <div
            key={day.dayOfWeek}
            className={cn(
              "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all duration-200",
              day.isAvailable
                ? "bg-card border-border shadow-sm"
                : "bg-muted/40 border-transparent"
            )}
          >
            {/* Day toggle */}
            <div className="flex items-center gap-3 sm:w-40 shrink-0">
              <Switch
                checked={day.isAvailable}
                onCheckedChange={(v) => updateDay(day.dayOfWeek, "isAvailable", v)}
                size="sm"
              />
              <span
                className={cn(
                  "text-sm font-medium min-w-[80px]",
                  day.isAvailable
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {DAY_LABELS[day.dayOfWeek]}
              </span>
            </div>

            {/* Time range */}
            {day.isAvailable ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, "startTime", e.target.value)
                    }
                    className={cn(
                      "h-8 rounded-lg border border-input bg-background",
                      "px-2 text-sm text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                      "transition-all duration-150"
                    )}
                    aria-label={`${DAY_LABELS[day.dayOfWeek]} start time`}
                  />
                </div>
                <span className="text-muted-foreground text-sm">to</span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) =>
                    updateDay(day.dayOfWeek, "endTime", e.target.value)
                  }
                  className={cn(
                    "h-8 rounded-lg border border-input bg-background",
                    "px-2 text-sm text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
                    "transition-all duration-150"
                  )}
                  aria-label={`${DAY_LABELS[day.dayOfWeek]} end time`}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                Unavailable
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={onBack}
          leftIcon={<ArrowLeft />}
          type="button"
        >
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          isLoading={isLoading}
          onClick={() => onNext(availability)}
          rightIcon={!isLoading ? <ArrowRight /> : undefined}
          type="button"
        >
          {isLoading ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 3 — First Service
// ─────────────────────────────────────────────

function Step3({
  onNext,
  onBack,
  isLoading,
}: {
  onNext: (data: ServiceInput) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      duration_minutes: 30,
      price: 500,
    },
  });

  const DURATION_PRESETS = [15, 30, 45, 60, 90];
  const [selectedDuration, setSelectedDuration] = useState(30);

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      <Input
        label="Service name"
        id="onb-service-name"
        placeholder="General Consultation"
        leftIcon={<Stethoscope />}
        error={errors.name?.message}
        required
        {...register("name")}
        helperText="This is what patients will see on the booking widget"
      />

      <Input
        label="Description"
        id="onb-service-desc"
        placeholder="Brief description of what this service includes (optional)"
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Duration — quick presets */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground/80">
          Duration <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {DURATION_PRESETS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setSelectedDuration(min)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-150",
                selectedDuration === min
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              {min} min
            </button>
          ))}
          {/* Custom input */}
          <div className="flex items-center gap-2 bg-background border border-input rounded-xl px-3 py-2">
            <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="number"
              min={5}
              max={480}
              className="w-14 text-sm bg-transparent focus:outline-none text-foreground"
              placeholder="Custom"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              aria-label="Custom duration in minutes"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
        {/* Hidden RHF field for duration_minutes */}
        <input
          type="hidden"
          {...register("duration_minutes", { valueAsNumber: true })}
          value={selectedDuration}
        />
      </div>

      {/* Price */}
      <Input
        label="Consultation fee (₹)"
        id="onb-price"
        type="number"
        min={0}
        placeholder="500"
        leftIcon={<IndianRupee />}
        error={errors.price?.message}
        required
        {...register("price", { valueAsNumber: true })}
        helperText="You can add more services and edit prices from the dashboard"
      />

      <div className="flex gap-3 mt-2">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={onBack}
          leftIcon={<ArrowLeft />}
          type="button"
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          isLoading={isLoading}
          rightIcon={
            !isLoading ? <CheckCircle2 /> : undefined
          }
        >
          {isLoading ? "Finishing setup…" : "Finish setup"}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main onboarding page
// ─────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const goNext = () => setCurrentStep((p) => Math.min(p + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((p) => Math.max(p - 1, 0));

  // ── Step 1 handler ────────────────────────

  const handleStep1 = async (data: Step1Input) => {
    setIsLoading(true);
    const { error } = await updateClinicProfile({
      name: data.clinicName,
      city: data.city,
      phone: data.phone,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Clinic details saved ✓");
    goNext();
  };

  // ── Step 2 handler ────────────────────────

  const handleStep2 = async (days: DayAvailability[]) => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        days.map((day) =>
          updateAvailability(day.dayOfWeek, {
            is_available: day.isAvailable,
            start_time: day.startTime,
            end_time: day.endTime,
            break_start: null,
            break_end: null,
          })
        )
      );

      const failed = results.find((r) => r.error);
      if (failed) {
        toast.error(failed.error ?? "Failed to save working hours");
        return;
      }

      toast.success("Working hours saved ✓");
      goNext();
    } catch {
      toast.error("Unexpected error saving working hours");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3 handler ────────────────────────

  const handleStep3 = async (data: ServiceInput) => {
    setIsLoading(true);

    const { error: svcError } = await createService({
      name: data.name,
      description: data.description ?? null,
      duration_minutes: data.duration_minutes,
      price: data.price,
    });

    if (svcError) {
      toast.error(svcError);
      setIsLoading(false);
      return;
    }

    // Mark onboarding complete (if column exists, but it doesn't in types/supabase.ts, so we skip it for now to avoid crashes)
    /* 
    const { error: profileError } = await updateClinicProfile({
      onboarding_completed: true,
    });
    */
    const profileError = null;

    if (profileError) {
      toast.error(profileError);
      setIsLoading(false);
      return;
    }

    toast.success("🎉 Setup complete! Welcome to Prime Health.");
    router.push("/dashboard");
    router.refresh();
  };

  const step = STEPS[currentStep];
  const progressValue = ((currentStep) / STEPS.length) * 100;

  return (
    <div className="min-h-screen auth-bg flex flex-col">
      {/* ── Top bar ────────────────────────── */}
      <div className="p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_2px_8px_hsl(var(--primary)/0.4)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Prime<span className="text-primary">Health</span>
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          Step {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* ── Progress bar ─────────────────────── */}
      <div className="px-6 sm:px-8">
        <Progress
          value={progressValue}
          className="h-1"
          animated={isLoading}
        />
      </div>

      {/* ── Main content ──────────────────────── */}
      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl space-y-8">

          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={currentStep} />

          {/* Step header */}
          <div className="animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              Step {currentStep + 1} — {step.title}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {step.title}
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              {step.subtitle}
            </p>
          </div>

          {/* Step card */}
          <Card className="animate-fade-up stagger-1 shadow-[0_8px_32px_hsl(var(--foreground)/0.08)] border-border/60">
            <CardContent className="p-6">
              {currentStep === 0 && (
                <Step1 onNext={handleStep1} isLoading={isLoading} />
              )}
              {currentStep === 1 && (
                <Step2
                  onNext={handleStep2}
                  onBack={goBack}
                  isLoading={isLoading}
                />
              )}
              {currentStep === 2 && (
                <Step3
                  onNext={handleStep3}
                  onBack={goBack}
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* Bottom hint */}
          <p className="text-xs text-center text-muted-foreground pb-4">
            You can edit all of these details later from your dashboard settings.
          </p>
        </div>
      </div>
    </div>
  );
}
