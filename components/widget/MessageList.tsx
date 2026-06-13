"use client";

import { useEffect, useRef } from "react";
import { useWidgetStore } from "./useWidgetStore";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { BookingCard } from "./BookingCard";

export function MessageList() {
  const { messages, isTyping, isBookingReady, bookingComplete } = useWidgetStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping, isBookingReady]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isTyping && <TypingIndicator />}

      {isBookingReady && !bookingComplete && <BookingCard />}

      <div ref={bottomRef} />
    </div>
  );
}
