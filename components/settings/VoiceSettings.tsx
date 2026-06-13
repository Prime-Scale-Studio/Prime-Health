'use client'

/**
 * components/settings/VoiceSettings.tsx
 * Doctor dashboard panel for configuring the voice assistant.
 * Follows the settings page pattern from AGENTS.md.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Volume2, Languages, Sliders, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { getVoiceSettings, updateVoiceSettings } from '@/actions/settings/voice'

// ─────────────────────────────────────────────
// Form state type
// ─────────────────────────────────────────────

interface VoiceForm {
  is_enabled: boolean
  default_language: 'en' | 'hi'
  auto_detect_language: boolean
  voice_gender: 'male' | 'female'
  speech_rate: number
  noise_cancellation: boolean
}

const DEFAULT_FORM: VoiceForm = {
  is_enabled: false,
  default_language: 'en',
  auto_detect_language: true,
  voice_gender: 'female',
  speech_rate: 1.0,
  noise_cancellation: true,
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${checked ? 'bg-primary' : 'bg-muted'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Preview voice (browser TTS)
// ─────────────────────────────────────────────

function previewVoice(language: 'en' | 'hi', gender: 'male' | 'female', rate: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    toast.error('Speech synthesis not available in this browser.')
    return
  }

  window.speechSynthesis.cancel()

  const text =
    language === 'hi'
      ? 'नमस्ते, मैं आपका क्लिनिक सहायक हूँ।'
      : 'Hello, I am your clinic assistant.'

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
  utterance.rate = rate

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(
    (v) =>
      v.lang === (language === 'hi' ? 'hi-IN' : 'en-IN') &&
      (gender === 'female' ? /female|woman/i.test(v.name) : /male|man/i.test(v.name))
  ) ?? voices.find((v) => v.lang === (language === 'hi' ? 'hi-IN' : 'en-IN'))

  if (preferred) utterance.voice = preferred

  window.speechSynthesis.speak(utterance)
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function VoiceSettings() {
  const [form, setForm] = useState<VoiceForm>(DEFAULT_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // ── Load settings on mount ──
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const { data, error } = await getVoiceSettings()
      if (error && error !== 'Unauthorized') {
        toast.error(`Failed to load voice settings: ${error}`)
      }
      if (data) {
        setForm({
          is_enabled: data.is_enabled ?? false,
          default_language: (data.default_language as 'en' | 'hi') ?? 'en',
          auto_detect_language: data.auto_detect_language ?? true,
          voice_gender: (data.voice_gender as 'male' | 'female') ?? 'female',
          speech_rate: data.speech_rate ?? 1.0,
          noise_cancellation: data.noise_cancellation ?? true,
        })
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const patch = useCallback(<K extends keyof VoiceForm>(key: K, value: VoiceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Save ──
  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await updateVoiceSettings(form)
    setIsSaving(false)
    if (error) {
      toast.error(`Failed to save: ${error}`)
    } else {
      toast.success('Voice settings saved!')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading…
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Master toggle card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Voice Widget</h3>
            <p className="text-sm text-muted-foreground">
              Enable patients to speak to the AI instead of typing
            </p>
          </div>
        </div>

        <div className="px-6 divide-y divide-border">
          <ToggleRow
            id="voice-enabled"
            label="Enable Voice Widget"
            description="A microphone button appears next to the chat input"
            checked={form.is_enabled}
            onChange={(v) => patch('is_enabled', v)}
          />
          <ToggleRow
            id="voice-auto-detect"
            label="Auto-detect Language"
            description="Switches between English and Hindi based on patient's speech"
            checked={form.auto_detect_language}
            onChange={(v) => patch('auto_detect_language', v)}
          />
          <ToggleRow
            id="voice-noise"
            label="Noise Cancellation"
            description="Browser-level noise suppression (Chrome / Edge only)"
            checked={form.noise_cancellation}
            onChange={(v) => patch('noise_cancellation', v)}
          />
        </div>
      </div>

      {/* ── Language & voice card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-3">
          <div className="bg-violet-500/10 p-2.5 rounded-xl">
            <Languages className="h-5 w-5 text-violet-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Language &amp; Voice</h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Default language */}
          <div className="space-y-1.5">
            <label
              htmlFor="voice-default-lang"
              className="text-sm font-medium text-foreground"
            >
              Default Language
            </label>
            <select
              id="voice-default-lang"
              value={form.default_language}
              onChange={(e) => patch('default_language', e.target.value as 'en' | 'hi')}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          {/* Voice gender */}
          <div className="space-y-1.5">
            <label
              htmlFor="voice-gender"
              className="text-sm font-medium text-foreground"
            >
              Voice Gender
            </label>
            <select
              id="voice-gender"
              value={form.voice_gender}
              onChange={(e) => patch('voice_gender', e.target.value as 'male' | 'female')}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Speech rate card ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl">
            <Sliders className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Speech Rate</h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Slower</span>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {form.speech_rate.toFixed(1)}×
            </span>
            <span className="text-sm text-muted-foreground">Faster</span>
          </div>
          <input
            id="voice-speech-rate"
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={form.speech_rate}
            onChange={(e) => patch('speech_rate', parseFloat(e.target.value))}
            className="w-full accent-primary"
            aria-label="Speech rate"
          />
          <p className="text-xs text-muted-foreground text-center">
            Default is 1.0× — patients will hear responses at this speed.
          </p>
        </div>
      </div>

      {/* ── Preview + Save row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => previewVoice(form.default_language, form.voice_gender, form.speech_rate)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          <Volume2 className="h-4 w-4" />
          Preview Voice
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </motion.div>
  )
}
