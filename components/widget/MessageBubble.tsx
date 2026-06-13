"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { Message } from "./useWidgetStore";
import { messageBubbleVariants } from "./animations";
import { useWidgetStore } from "./useWidgetStore";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { themeColor } = useWidgetStore();

  return (
    <motion.div
      variants={messageBubbleVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex items-end gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 ${
            isUser ? "bg-slate-200 text-slate-500" : "text-white shadow-sm"
          }`}
          style={!isUser ? { backgroundColor: themeColor } : undefined}
          aria-hidden="true"
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-[14px] leading-relaxed rounded-2xl shadow-sm ${
            isUser
              ? "text-white rounded-br-sm"
              : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
          }`}
          style={isUser ? { backgroundColor: themeColor } : undefined}
        >
          {message.content}
        </div>
      </div>
    </motion.div>
  );
});
