import type { Metadata } from 'next'
import { Mic } from 'lucide-react'
import { VoiceSettings } from '@/components/settings/VoiceSettings'

export const metadata: Metadata = {
  title: 'Voice Assistant | Prime Health',
  description: 'Enable patients to speak to your AI assistant instead of typing.',
}

export default function VoiceSettingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8 pb-16">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <Mic className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Voice Assistant
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Enable patients to speak to your AI assistant instead of typing. Voice uses the
          browser&apos;s built-in speech recognition — zero external API cost.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
      >
        <span className="text-base shrink-0" aria-hidden="true">
          ℹ️
        </span>
        <p>
          <strong className="font-semibold">Browser compatibility:</strong> Voice works on
          Chrome, Edge, and Safari. Firefox is not supported — patients on Firefox can still
          use text chat.
        </p>
      </div>

      <VoiceSettings />
    </div>
  )
}
