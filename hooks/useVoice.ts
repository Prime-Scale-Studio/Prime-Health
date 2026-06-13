'use client'

/**
 * hooks/useVoice.ts
 * 100% browser-native voice — Web Speech API only.
 * Zero external API cost. SERVER NEVER SEES AUDIO BYTES.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────
// Browser type declarations (not in lib.dom by default)
// ─────────────────────────────────────────────

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEvent {
  error: string
}
interface SpeechRecognitionResult {
  readonly 0: SpeechRecognitionAlternative
  readonly length: number
  isFinal: boolean
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance
}

// ─────────────────────────────────────────────
// Language detection
// ─────────────────────────────────────────────

export function detectLanguage(text: string): 'en' | 'hi' {
  // Hindi unicode range: \u0900-\u097F
  const hindiChars = (text.match(/[\u0900-\u097F]/g) ?? []).length
  const totalChars = text.replace(/\s/g, '').length
  return totalChars > 0 && hindiChars / totalChars > 0.3 ? 'hi' : 'en'
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: 'en' | 'hi',
  gender: 'male' | 'female'
): SpeechSynthesisVoice | undefined {
  const langCode = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const genderMatch = (v: SpeechSynthesisVoice) =>
    gender === 'female'
      ? /female|woman|kanya|स्त्री/i.test(v.name)
      : /male|man|puruṣ|पुरुष/i.test(v.name)

  return (
    voices.find((v) => v.lang === langCode && genderMatch(v)) ??
    voices.find((v) => v.lang === langCode) ??
    voices[0]
  )
}

// ─────────────────────────────────────────────
// Error code → user-friendly message
// ─────────────────────────────────────────────

function mapSpeechError(code: string): string {
  switch (code) {
    case 'no-speech':
      return 'No speech detected. Please try again.'
    case 'audio-capture':
      return 'Microphone not found.'
    case 'not-allowed':
      return 'Microphone permission denied.'
    default:
      return 'Voice recognition failed. Please type instead.'
  }
}

// ─────────────────────────────────────────────
// Return type
// ─────────────────────────────────────────────

export interface UseVoiceReturn {
  isListening: boolean
  isSpeaking: boolean
  isSupported: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  speak: (text: string, lang?: 'en' | 'hi') => void
  stopSpeaking: () => void
  error: string | null
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useVoice(options: {
  language: 'en' | 'hi'
  onTranscript: (text: string) => void
  speechRate?: number
  voiceGender?: 'male' | 'female'
  autoDetectLanguage?: boolean
  onError?: (error: string) => void
}): UseVoiceReturn {
  const {
    language,
    onTranscript,
    speechRate = 1.0,
    voiceGender = 'female',
    autoDetectLanguage = true,
    onError,
  } = options

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Detect support once on client
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // ── Build / update recognition instance ──
  const buildRecognition = useCallback(
    (lang: 'en' | 'hi'): SpeechRecognitionInstance | null => {
      if (!isSupported) return null

      const W = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor
        webkitSpeechRecognition?: SpeechRecognitionConstructor
      }
      const SR = W.SpeechRecognition ?? W.webkitSpeechRecognition
      if (!SR) return null

      const rec = new SR()
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
      rec.continuous = false
      rec.interimResults = false
      rec.maxAlternatives = 1
      return rec
    },
    [isSupported]
  )

  // ── speak ──
  const speak = useCallback(
    (text: string, lang?: 'en' | 'hi') => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      const effectiveLang = lang ?? language

      // Prefer Indian voice
      const loadAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices()
        const preferred = pickVoice(voices, effectiveLang, voiceGender)

        if (preferred) utterance.voice = preferred
        utterance.lang = effectiveLang === 'hi' ? 'hi-IN' : 'en-IN'
        utterance.rate = speechRate
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        window.speechSynthesis.speak(utterance)
      }

      // Voices may not be loaded yet on first call
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadAndSpeak, { once: true })
      } else {
        loadAndSpeak()
      }
    },
    [language, speechRate, voiceGender]
  )

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // ── startListening ──
  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = 'Voice recognition is not supported in this browser.'
      setError(msg)
      onError?.(msg)
      return
    }

    // Stop any ongoing speech first
    stopSpeaking()

    setError(null)
    setTranscript('')

    const rec = buildRecognition(language)
    if (!rec) return
    recognitionRef.current = rec

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const raw = event.results[0]?.[0]?.transcript ?? ''
      setTranscript(raw)
      onTranscript(raw)
      setIsListening(false)

      // Auto-detect language for TTS on next response
      if (autoDetectLanguage && raw.trim()) {
        const detectedLang = detectLanguage(raw)
        if (detectedLang !== language) {
          // Parent reads transcript and resolves language server-side
        }
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = mapSpeechError(event.error)
      setError(msg)
      onError?.(msg)
      setIsListening(false)
    }

    rec.onend = () => {
      setIsListening(false)
    }

    try {
      rec.start()
      setIsListening(true)
    } catch {
      setError('Could not start microphone. Please try again.')
      setIsListening(false)
    }
  }, [isSupported, language, buildRecognition, onTranscript, onError, stopSpeaking])

  // ── stopListening ──
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel()
      }
    }
  }, [])

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error,
  }
}
