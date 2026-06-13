"use client";

import React, { useState } from "react";
import { Monitor, Smartphone, Tablet, Send, X, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function WidgetPreview({ clinic }: { clinic: any }) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const themeColor = clinic?.widget_theme_color || "#2563EB";
  const clinicName = clinic?.name || "Your Clinic";
  const language = clinic?.language || "en";
  const tone = clinic?.widget_tone || "professional";

  const getWelcomeMessage = () => {
    if (language === "hi") return "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?";
    switch (tone) {
      case "friendly": return `Hi there! Welcome to ${clinicName}. I'm here to help you schedule an appointment. How can I assist you today?`;
      case "formal": return `Greetings. Welcome to ${clinicName}. Please let me know how I may assist you with your booking.`;
      default: return `Hello! I'm the assistant for ${clinicName}. How can I help you book an appointment today?`;
    }
  };

  const getUserSample = () => {
    return language === "hi" ? "मुझे कल डॉक्टर से मिलना है" : "I need to see the doctor tomorrow";
  };

  const getBotResponse = () => {
    if (language === "hi") return "ज़रूर, कल के लिए सुबह 10:00 बजे का समय उपलब्ध है। क्या मैं यह बुक कर दूँ?";
    switch (tone) {
      case "friendly": return "I can definitely help with that! We have an opening tomorrow at 10:00 AM. Would you like me to reserve that for you?";
      case "formal": return "Certainly. We have availability tomorrow at 10:00 AM. Shall I proceed with this booking?";
      default: return "Sure, I see an available slot tomorrow at 10:00 AM. Would you like to book this?";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
          <p className="text-sm text-muted-foreground mt-1">See how it looks on your website.</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDevice("desktop")}
            className={cn("rounded-md", device === "desktop" && "bg-card shadow-sm")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDevice("tablet")}
            className={cn("rounded-md", device === "tablet" && "bg-card shadow-sm")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => setDevice("mobile")}
            className={cn("rounded-md", device === "mobile" && "bg-card shadow-sm")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-muted/30 border border-dashed border-border rounded-xl flex items-center justify-center p-6 relative overflow-hidden min-h-[500px]">
        {/* Mock browser window / container */}
        <div 
          className={cn(
            "bg-background border border-border shadow-2xl relative transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
            device === "desktop" ? "w-full max-w-3xl h-[600px] rounded-xl" :
            device === "tablet" ? "w-[768px] h-[900px] rounded-xl scale-[0.6] origin-center" :
            "w-[375px] h-[750px] rounded-[2rem] border-4 border-foreground scale-[0.8] origin-center"
          )}
        >
          {/* Mock content behind widget */}
          <div className="absolute inset-0 p-8 opacity-20 pointer-events-none">
            <div className="h-10 w-32 bg-foreground/20 rounded mb-8" />
            <div className="space-y-4">
              <div className="h-24 w-3/4 bg-foreground/10 rounded" />
              <div className="h-4 w-full bg-foreground/5 rounded" />
              <div className="h-4 w-5/6 bg-foreground/5 rounded" />
              <div className="h-4 w-4/6 bg-foreground/5 rounded" />
            </div>
          </div>

          {/* Widget Mockup */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-4 z-10">
            {/* Chat Panel */}
            <div className="w-[340px] bg-background border border-border shadow-xl rounded-2xl overflow-hidden flex flex-col h-[480px]">
              {/* Header */}
              <div 
                className="p-4 flex items-center justify-between text-white"
                style={{ backgroundColor: themeColor }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight">{clinicName}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Online • Replies instantly</div>
                  </div>
                </div>
                <X className="h-4 w-4 opacity-70 cursor-pointer" />
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10 flex flex-col justify-end">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0 mt-1" style={{ backgroundColor: themeColor }}>
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%]">
                    {getWelcomeMessage()}
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%]" style={{ backgroundColor: themeColor }}>
                    {getUserSample()}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0 mt-1" style={{ backgroundColor: themeColor }}>
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm text-sm shadow-sm max-w-[85%]">
                    {getBotResponse()}
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-background border-t border-border flex items-center gap-2">
                <div className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm text-muted-foreground border border-border/50">
                  Type your message...
                </div>
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  <Send className="h-4 w-4" />
                </div>
              </div>
              <div className="text-center py-1.5 text-[9px] text-muted-foreground border-t border-border bg-muted/20">
                Powered by Prime Health
              </div>
            </div>

            {/* Launcher Button */}
            <div 
              className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: themeColor }}
            >
              <X className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
