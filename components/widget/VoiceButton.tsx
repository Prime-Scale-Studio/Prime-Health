'use client'

/**
 * components/widget/VoiceButton.tsx
 * Mic button that lives next to the text input.
 * 5 visual states: idle | listening | processing | speaking | unsupported (hidden)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { detectLanguage, useVoice } from '@/hooks/useVoice'

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface VoiceButtonProps {
  /** Whether voice is enabled from doctor settings */
  isEnabled: boolean
  /** Language preference */
  language: 'en' | 'hi'
  /** Called when speech is transcribed — parent injects into chat */
  onTranscript: (text: string) => void
  /** Latest AI response text — auto-spoken when it changes and chat is idle */
  currentAIResponse?: string
  /** Whether AI is currently generating a response */
  isChatLoading: boolean
  /** Speech rate from voice_settings (default 1.0) */
  speechRate?: number
  /** Voice gender from voice_settings */
  voiceGender?: 'male' | 'female'
  /** Auto-detect language from voice_settings */
  autoDetectLanguage?: boolean
}

// ─────────────────────────────────────────────
// Visual state type
// ─────────────────────────────────────────────

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

// ─────────────────────────────────────────────
// Ripple ring animation (shown while listening)
// ─────────────────────────────────────────────

function RippleRing() {
  return (
    <>
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full bg-red-400"
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut',
          }}
        />
      ))}
    </>
  )
}

// ─────────────────────────────────────────────
// Wave bars animation (shown while speaking)
// ─────────────────────────────────────────────

function WaveBars() {
  return (
    <div className="flex items-center gap-[2px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-emerald-400"
          animate={{ height: ['6px', '14px', '6px'] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function VoiceButton({
  isEnabled,
  language,
  onTranscript,
  currentAIResponse,
  isChatLoading,
  speechRate = 1.0,
  voiceGender = 'female',
  autoDetectLanguage = true,
}: VoiceButtonProps) {

  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevResponse = useRef<string | undefined>(undefined)

  const handleTranscript = useCallback(
    (text: string) => {
      setVoiceState('processing')
      onTranscript(text)
      // Processing state clears when isChatLoading goes false (parent updates)
    },
    [onTranscript]
  )

  const handleError = useCallback((err: string) => {
    setVoiceState('idle')
    toast.error(err, { duration: 3000 })
  }, [])

  const { isListening, isSpeaking, isSupported, startListening, stopListening, speak } =
    useVoice({
      language,
      onTranscript: handleTranscript,
      speechRate,
      voiceGender,
      autoDetectLanguage,
      onError: handleError,
    })

  // Sync internal state with hook state
  useEffect(() => {
    if (isListening) setVoiceState('listening')
    else if (isSpeaking) setVoiceState('speaking')
    else if (voiceState !== 'processing') setVoiceState('idle')
  }, [isListening, isSpeaking]) // intentionally exclude voiceState

  // When chat finishes loading → clear processing state
  useEffect(() => {
    if (!isChatLoading && voiceState === 'processing') {
      setVoiceState('idle')
    }
  }, [isChatLoading, voiceState])

  // Auto-speak new AI responses
  useEffect(() => {
    if (
      currentAIResponse &&
      currentAIResponse !== prevResponse.current &&
      !isChatLoading &&
      isEnabled
    ) {
      prevResponse.current = currentAIResponse
      const speakLang = autoDetectLanguage
        ? detectLanguage(currentAIResponse)
        : language
      speak(currentAIResponse, speakLang)
    }
  }, [currentAIResponse, isChatLoading, isEnabled, speak, language, autoDetectLanguage])

  // ── Hidden if unsupported or disabled ──
  if (!isEnabled || !isSupported) return null

  // ── Long-press → stop listening ──
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      if (isListening) stopListening()
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // ── Click → toggle ──
  const handleClick = () => {
    if (voiceState === 'listening') {
      stopListening()
    } else if (voiceState === 'idle') {
      startListening()
    }
  }

  // ── Styles per state ──
  const buttonClasses: Record<VoiceState, string> = {
    idle: 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700',
    listening: 'bg-red-500 text-white shadow-red-200 shadow-lg',
    processing: 'bg-blue-500 text-white',
    speaking: 'bg-emerald-500 text-white',
  }

  const ariaLabels: Record<VoiceState, string> = {
    idle: 'Start voice input',
    listening: 'Listening… click to stop',
    processing: 'Processing…',
    speaking: 'Speaking…',
  }

  return (
    <motion.div
      className="relative flex items-center justify-center shrink-0"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Ripple rings when listening */}
      {voiceState === 'listening' && <RippleRing />}

      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        disabled={voiceState === 'processing'}
        aria-label={ariaLabels[voiceState]}
        className={`
          relative z-10 w-10 h-10 rounded-full
          flex items-center justify-center
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
          active:scale-90 disabled:cursor-not-allowed
          ${buttonClasses[voiceState]}
        `}
      >
        <AnimatePresence mode="wait" initial={false}>
          {voiceState === 'idle' && (
            <motion.span
              key="mic"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
              exit={{ scale: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Mic size={17} strokeWidth={2.5} />
            </motion.span>
          )}

          {voiceState === 'listening' && (
            <motion.span
              key="mic-on"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MicOff size={17} strokeWidth={2.5} />
            </motion.span>
          )}

          {voiceState === 'processing' && (
            <motion.span
              key="spinner"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Loader2 size={17} className="animate-spin" />
            </motion.span>
          )}

          {voiceState === 'speaking' && (
            <motion.span
              key="wave"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1"
            >
              <Volume2 size={14} strokeWidth={2.5} />
              <WaveBars />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}
