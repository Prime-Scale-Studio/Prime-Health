"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export function AiSettingsClient() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold">AI Configuration</h2>
      <p className="text-muted-foreground max-w-sm">
        Advanced AI persona settings, language preferences, and knowledge base configuration coming soon.
      </p>
    </div>
  );
}

