"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WidgetConfigProps {
  clinic: any;
  onChange: (fields: any) => void;
}

export function WidgetConfig({ clinic, onChange }: WidgetConfigProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Widget Configuration</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how your AI assistant appears and communicates.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Theme Color</Label>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-border/50 shadow-sm cursor-pointer">
              <input
                type="color"
                value={clinic.widget_theme_color || "#2563EB"}
                onChange={(e) => onChange({ widget_theme_color: e.target.value })}
                className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
              />
            </div>
            <Input 
              value={clinic.widget_theme_color || "#2563EB"}
              onChange={(e) => onChange({ widget_theme_color: e.target.value })}
              className="w-32 uppercase font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Widget Tone</Label>
          <RadioGroup 
            value={clinic.widget_tone || "professional"} 
            onValueChange={(val) => onChange({ widget_tone: val })}
            className="flex flex-col gap-2"
          >
            <Label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors [&:has(:checked)]:border-primary/50 [&:has(:checked)]:bg-primary/5">
              <RadioGroupItem value="professional" id="t-prof" />
              <div>
                <span className="font-medium text-foreground block">Professional</span>
                <span className="text-xs text-muted-foreground font-normal">Clear, concise, and medical.</span>
              </div>
            </Label>
            <Label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors [&:has(:checked)]:border-primary/50 [&:has(:checked)]:bg-primary/5">
              <RadioGroupItem value="friendly" id="t-friend" />
              <div>
                <span className="font-medium text-foreground block">Friendly</span>
                <span className="text-xs text-muted-foreground font-normal">Warm, empathetic, and welcoming.</span>
              </div>
            </Label>
            <Label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors [&:has(:checked)]:border-primary/50 [&:has(:checked)]:bg-primary/5">
              <RadioGroupItem value="formal" id="t-form" />
              <div>
                <span className="font-medium text-foreground block">Formal</span>
                <span className="text-xs text-muted-foreground font-normal">Highly respectful and polite.</span>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Default Language</Label>
          <Select 
            value={clinic.language || "en"}
            onChange={(e) => onChange({ language: e.target.value })}
            options={[
              { label: "English", value: "en" },
              { label: "Hindi (हिंदी)", value: "hi" }
            ]}
          />
          <p className="text-[11px] text-muted-foreground">The AI will automatically switch languages based on patient input, but this sets the initial greeting.</p>
        </div>
      </div>
    </div>
  );
}
