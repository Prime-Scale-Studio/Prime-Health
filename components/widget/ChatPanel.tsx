'use client'

/**
 * components/widget/ChatPanel.tsx
 * Main chat view. Fetches voice_settings for the clinic and passes them
 * to ChatInput so VoiceButton appears when enabled.
 * BOOKING_READY logic and all other behaviour — untouched.
 */

import { useEffect, useState } from 'react'
import { useWidgetStore } from './useWidgetStore'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { QuickActions } from './QuickActions'
import { PersonalizedGreeting } from './PersonalizedGreeting'

interface VoiceConfig {
  isEnabled: boolean
  defaultLanguage: 'en' | 'hi'
  speechRate: number
  voiceGender: 'male' | 'female'
  autoDetectLanguage: boolean
}

export function ChatPanel() {
  const { messages, sendMessage, isTyping, isBookingReady, bookingComplete, customer, clinicId } =
    useWidgetStore()

  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    isEnabled: false,
    defaultLanguage: 'en',
    speechRate: 1.0,
    voiceGender: 'female',
    autoDetectLanguage: true,
  })

  // Fetch voice settings once when clinicId is available
  useEffect(() => {
    if (!clinicId) return

    const load = async () => {
      try {
        const res = await fetch(`/api/widget/voice-settings?clinicId=${clinicId}`)
        if (!res.ok) return
        const data = (await res.json()) as {
          is_enabled: boolean
          default_language: 'en' | 'hi'
          speech_rate: number
          voice_gender: 'male' | 'female'
          auto_detect_language: boolean
        }
        setVoiceConfig({
          isEnabled: data.is_enabled ?? false,
          defaultLanguage: data.default_language ?? 'en',
          speechRate: data.speech_rate ?? 1.0,
          voiceGender: data.voice_gender ?? 'female',
          autoDetectLanguage: data.auto_detect_language ?? true,
        })
      } catch {
        // Voice settings unavailable — graceful fallback: voice stays disabled
      }
    }

    load()
  }, [clinicId])

  const handleQuickAction = (message: string) => {
    sendMessage(message)
  }

  const showQuickActions = messages.length <= 1 && !isTyping && !isBookingReady

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatHeader />

      {/* Returning customer greeting in chat */}
      {customer && messages.length <= 2 && (
        <div className="pt-4 px-4 bg-gray-50/40">
          <PersonalizedGreeting customer={customer} />
        </div>
      )}

      <MessageList />

      <div className="flex flex-col shrink-0 bg-white">
        {showQuickActions && <QuickActions onSelect={handleQuickAction} />}
        <ChatInput
          voiceEnabled={voiceConfig.isEnabled}
          voiceLanguage={voiceConfig.defaultLanguage}
          speechRate={voiceConfig.speechRate}
          voiceGender={voiceConfig.voiceGender}
          autoDetectLanguage={voiceConfig.autoDetectLanguage}
        />
      </div>
    </div>
  )
}
