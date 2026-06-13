"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("invalid")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.toLowerCase().includes("confirm")) {
          toast.error("Please verify your email before signing in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      router.push("/dashboard");
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
          Welcome back
        </h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your Prime Health dashboard
        </p>
      </div>

      <Card className="shadow-[0_8px_32px_hsl(var(--foreground)/0.08)] border-border/60">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="p-6 space-y-5">

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              id="login-email"
              placeholder="dr.kumar@example.com"
              autoComplete="email"
              autoFocus
              leftIcon={<Mail />}
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password */}
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              id="login-password"
              placeholder="Enter your password"
              autoComplete="current-password"
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
              {...register("password")}
            />

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline underline-offset-4 font-medium transition-all"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="px-6 pb-6 pt-0 flex-col gap-4">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight /> : undefined}
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>

            <Separator className="my-1" />

            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:underline underline-offset-4 transition-all"
              >
                Create one free
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Social proof strip */}
      <div className="mt-8 flex items-center justify-center gap-6 opacity-50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          <span>HIPAA‑ready infrastructure</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>🔒</span>
          <span>End‑to‑end encrypted</span>
        </div>
      </div>
    </>
  );
}
