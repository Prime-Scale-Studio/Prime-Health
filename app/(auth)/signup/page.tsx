"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  User,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clinicSignupSchema, type ClinicSignupInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Password strength calculator
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  colour: string;
} {
  if (!password) return { score: 0, label: "", colour: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", colour: "bg-destructive" };
  if (score <= 2) return { score, label: "Fair", colour: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", colour: "bg-blue-500" };
  return { score, label: "Strong", colour: "bg-emerald-500" };
}

const PERKS = [
  "AI-powered booking widget",
  "Smart appointment reminders",
  "Patient records management",
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ClinicSignupInput>({
    resolver: zodResolver(clinicSignupSchema),
  });

  // Watch password for strength indicator
  React.useEffect(() => {
    const sub = watch((vals) => setWatchedPassword(vals.password ?? ""));
    return () => sub.unsubscribe();
  }, [watch]);

  const strength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: ClinicSignupInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            doctor_name: data.doctorName,
            name: data.clinicName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          toast.error("This email is already registered. Try signing in instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Account created! Taking you to setup…");
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Start your free trial
        </h1>
        <p className="text-muted-foreground text-sm">
          Set up your clinic in under 2 minutes
        </p>
      </div>

      <Card className="shadow-[0_8px_32px_hsl(var(--foreground)/0.08)] border-border/60">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="p-6 space-y-5">

            {/* Doctor name */}
            <Input
              label="Your full name"
              type="text"
              id="signup-doctor-name"
              placeholder="Dr. Priya Kumar"
              autoComplete="name"
              autoFocus
              leftIcon={<User />}
              error={errors.doctorName?.message}
              required
              {...register("doctorName")}
            />

            {/* Clinic name */}
            <Input
              label="Clinic name"
              type="text"
              id="signup-clinic-name"
              placeholder="City Dental Clinic"
              autoComplete="organization"
              leftIcon={<Building2 />}
              error={errors.clinicName?.message}
              required
              {...register("clinicName")}
            />

            {/* Email */}
            <Input
              label="Work email"
              type="email"
              id="signup-email"
              placeholder="you@example.com"
              autoComplete="email"
              leftIcon={<Mail />}
              error={errors.email?.message}
              required
              {...register("email")}
            />

            {/* Password */}
            <div className="space-y-2">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                id="signup-password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                leftIcon={<Lock />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((p) => !p)}
                    className="pointer-events-auto text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                required
                {...register("password")}
              />

              {/* Password strength */}
              {watchedPassword.length > 0 && (
                <div className="space-y-1 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-all duration-300",
                          i <= strength.score
                            ? strength.colour
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-muted-foreground text-right">
                      {strength.label} password
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Perks */}
            <div className="rounded-xl bg-accent/60 border border-accent p-3.5 space-y-2">
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-foreground/80">{perk}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline underline-offset-4">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-0 flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight /> : undefined}
            >
              {isLoading ? "Creating your account…" : "Create free account"}
            </Button>

            <Separator className="my-1" />

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline underline-offset-4 transition-all"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Trust badges */}
      <div className="mt-8 flex items-center justify-center gap-6 opacity-50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>No credit card required</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>🔒</span>
          <span>256-bit SSL encryption</span>
        </div>
      </div>
    </>
  );
}
