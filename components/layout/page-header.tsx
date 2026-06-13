"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children?: React.ReactNode; // For action buttons
  className?: string;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 mb-8 animate-fade-in", className)}>
      {/* --- Breadcrumbs --- */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground overflow-x-auto no-scrollbar pb-1">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-1 hover:text-primary transition-colors shrink-0"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={12} className="shrink-0 text-muted-foreground/40" />
              {crumb.href ? (
                <Link 
                  href={crumb.href} 
                  className="hover:text-primary transition-colors whitespace-nowrap shrink-0"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground whitespace-nowrap shrink-0">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* --- Title & Actions --- */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}