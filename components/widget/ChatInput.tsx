'use client'

/**
 * components/widget/ChatInput.tsx
 * Text input + VoiceButton row at the bottom of ChatPanel.
 * Voice is additive — text input behaviour is completely unchanged.
 */

import { useRef, useState, useCallback } from 'react'
import { Send } from 'lucide-react'
import { detectLanguage } from '@/hooks/useVoice'
import { useWidgetStore } from './useWidgetStore'
import { VoiceButton } from './VoiceButton'

interface ChatInputProps {
  /** Whether voice is enabled for this clinic (from voice_settings) */
  voiceEnabled?: boolean
  /** Language for voice (en | hi) */
  voiceLanguage?: 'en' | 'hi'
  /** Speech rate from voice_settings */
  speechRate?: number
  /** Voice gender from voice_settings */
  voiceGender?: 'male' | 'female'
  /** Auto-detect language from voice_settings */
  autoDetectLanguage?: boolean
}

export function ChatInput({
  voiceEnabled = false,
  voiceLanguage = 'en',
  speechRate = 1.0,
  voiceGender = 'female',
  autoDetectLanguage = true,
}: ChatInputProps) {
  const {
    sendMessage,
    sendVoiceMessage,
    isTyping,
    isBookingReady,
    bookingComplete,
    themeColor,
    messages,
  } = useWidgetStore()

  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = isTyping || (isBookingReady && !bookingComplete)

  // ── Latest assistant message for TTS auto-play ──
  const latestAIResponse = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.content

  // ── Submit handler (shared by text and voice) ──
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = value.trim()
      if (!trimmed || isDisabled) return
      setValue('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      await sendMessage(trimmed)
    },
    [value, isDisabled, sendMessage]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ── VoiceButton → inject transcript → auto-submit via voice route ──
  const handleVoiceTranscript = useCallback(
    async (transcript: string) => {
      setValue(transcript)
      await new Promise<void>((r) => setTimeout(r, 50))
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      setValue('')

      const resolvedLanguage =
        autoDetectLanguage ? detectLanguage(transcript) : voiceLanguage

      await sendVoiceMessage(transcript, resolvedLanguage)
    },
    [autoDetectLanguage, voiceLanguage, sendVoiceMessage]
  )

  return (
    <div className="px-4 py-4 bg-white border-t border-slate-100 shrink-0">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isDisabled ? 'Complete action above...' : 'Message...'}
          disabled={isDisabled}
          rows={1}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-[14px] text-slate-900 font-medium placeholder:text-slate-400 resize-none min-h-[46px] max-h-[120px] focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
          style={{ '--tw-ring-color': `${themeColor}40` } as React.CSSProperties}
          aria-label="Chat message"
        />

        {/* Voice button — between textarea and send */}
        <VoiceButton
          isEnabled={voiceEnabled}
          language={voiceLanguage}
          onTranscript={handleVoiceTranscript}
          currentAIResponse={latestAIResponse}
          isChatLoading={isTyping}
          speechRate={speechRate}
          voiceGender={voiceGender}
          autoDetectLanguage={autoDetectLanguage}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!value.trim() || isDisabled}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 transition-all focus-visible:outline-none shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-30"
          style={{ backgroundColor: themeColor }}
          aria-label="Send message"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}
