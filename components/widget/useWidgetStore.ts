"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface BookingData {
  name: string | null;
  phone: string | null;
  email: string | null;
  serviceId: string | null;
  serviceName: string | null;
  date: string | null;
  time: string | null;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  totalAppointments: number;
  lastVisit: string | null;
}

export interface FormData {
  serviceId: string | null;
  serviceName: string | null;
  serviceDuration: number | null;
  date: string | null;
  time: string | null;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes: string;
}

export type WidgetView = "welcome" | "form" | "chat";
export type FormStep = 1 | 2 | 3;

export interface WidgetStore {
  // ── Clinic / init ───────────────────────────────────────
  clinicId: string | null;
  clinicName: string | null;
  doctorName: string | null;
  themeColor: string;
  isLoading: boolean;

  // ── UI State ────────────────────────────────────────────
  isOpen: boolean;
  currentView: WidgetView;

  // ── Customer Recognition ────────────────────────────────
  customer: CustomerInfo | null;

  // ── Multi-Step Form ─────────────────────────────────────
  formStep: FormStep;
  formData: FormData;
  isSubmittingForm: boolean;
  formBookingSuccess: boolean;

  // ── Chat State ──────────────────────────────────────────
  messages: Message[];
  sessionToken: string;
  isTyping: boolean;
  bookingData: BookingData | null;
  isBookingReady: boolean;
  bookingComplete: boolean;
  abortController: AbortController | null;

  // ── Actions ─────────────────────────────────────────────
  open: () => void;
  close: () => void;
  setView: (view: WidgetView) => void;
  setClinicData: (data: {
    clinicId: string;
    clinicName: string;
    doctorName: string;
    themeColor: string;
  }) => void;

  // Customer recognition
  setCustomer: (customer: CustomerInfo | null) => void;

  // Form actions
  setFormStep: (step: FormStep) => void;
  nextFormStep: () => void;
  prevFormStep: () => void;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  submitForm: () => Promise<void>;

  // Chat actions
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  sendMessage: (content: string) => Promise<void>;
  sendVoiceMessage: (transcript: string, language: "en" | "hi") => Promise<void>;
  confirmBooking: () => Promise<void>;
  setBookingComplete: (val: boolean) => void;

  // Hydration
  hydrate: () => void;
}

// ─────────────────────────────────────────────
// Initial form data
// ─────────────────────────────────────────────

const defaultFormData: FormData = {
  serviceId: null,
  serviceName: null,
  serviceDuration: null,
  date: null,
  time: null,
  patientName: "",
  patientPhone: "",
  patientEmail: "",
  notes: "",
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useWidgetStore = create<WidgetStore>()(
  persist(
    (set, get) => ({
      // Init
      clinicId: null,
      clinicName: null,
      doctorName: null,
      themeColor: "#8B5CF6",
      isLoading: true,

      // UI
      isOpen: false,
      currentView: "welcome",

      // Customer
      customer: null,

      // Form
      formStep: 1,
      formData: defaultFormData,
      isSubmittingForm: false,
      formBookingSuccess: false,

      // Chat
      messages: [],
      sessionToken: "",
      isTyping: false,
      bookingData: null,
      isBookingReady: false,
      bookingComplete: false,
      abortController: null,

      // ── Actions ──────────────────────────────────────────
      open: () => set({ isOpen: true, currentView: "welcome" }),
      close: () =>
        set({
          isOpen: false,
          currentView: "welcome",
          formStep: 1,
          formData: defaultFormData,
          isSubmittingForm: false,
          formBookingSuccess: false,
          messages: [],
          isBookingReady: false,
          bookingData: null,
          bookingComplete: false,
        }),

      setView: (view) => set({ currentView: view }),

      setClinicData: (data) =>
        set({
          clinicId: data.clinicId,
          clinicName: data.clinicName,
          doctorName: data.doctorName,
          themeColor: data.themeColor,
          isLoading: false,
        }),

      setCustomer: (customer) => set({ customer }),

      // Form
      setFormStep: (step) => set({ formStep: step }),
      nextFormStep: () => {
        const current = get().formStep;
        if (current < 3) set({ formStep: (current + 1) as FormStep });
      },
      prevFormStep: () => {
        const current = get().formStep;
        if (current > 1) set({ formStep: (current - 1) as FormStep });
      },
      updateFormData: (data) =>
        set((state) => ({ formData: { ...state.formData, ...data } })),
      resetForm: () =>
        set({ formData: defaultFormData, formStep: 1, formBookingSuccess: false }),

      submitForm: async () => {
        const { clinicId, formData } = get();
        if (!clinicId) return;

        set({ isSubmittingForm: true });

        try {
          let phone = formData.patientPhone.replace(/\D/g, "");
          if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);

          const res = await fetch("/api/widget/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clinicId,
              patientName: formData.patientName,
              patientPhone: phone,
              patientEmail: formData.patientEmail || "",
              serviceId: formData.serviceId,
              appointmentDate: formData.date,
              startTime: formData.time,
              booking_language: "en",
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to book appointment");
          }

          set({ formBookingSuccess: true });
        } catch (err) {
          throw err;
        } finally {
          set({ isSubmittingForm: false });
        }
      },

      // Chat
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: uuidv4(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      sendVoiceMessage: async (transcript: string, language: "en" | "hi") => {
        const { clinicId, sessionToken, messages, abortController } = get();
        if (!clinicId || !sessionToken) return;

        if (abortController) abortController.abort();
        const newController = new AbortController();
        set({ abortController: newController });

        const priorMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        get().addMessage({ role: "user", content: transcript });
        set({ isTyping: true });

        try {
          let attempt = 0;
          let responseText = "";
          let isBookingReady = false;
          let bookingPayload: BookingData | null = null;

          while (attempt < 3) {
            try {
              const res = await fetch("/api/widget/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clinicId,
                  sessionToken,
                  transcript,
                  language,
                  messages: priorMessages,
                }),
                signal: newController.signal,
              });

              if (!res.ok) {
                const errBody = (await res.json()) as { error?: string };
                throw new Error(errBody.error ?? "Voice API error");
              }

              const data = (await res.json()) as {
                text: string;
                isBookingReady: boolean;
                bookingData?: BookingData;
              };

              responseText = data.text;
              isBookingReady = data.isBookingReady;
              if (data.bookingData) {
                bookingPayload = data.bookingData;
              }
              break;
            } catch (err: unknown) {
              if (err instanceof Error && err.name === "AbortError") throw err;
              attempt++;
              if (attempt >= 3) throw new Error("Failed after 3 attempts");
              await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
            }
          }

          if (isBookingReady && bookingPayload) {
            set({ isBookingReady: true, bookingData: bookingPayload });
            get().addMessage({
              role: "assistant",
              content: responseText || "Please review the details below:",
            });
          } else {
            get().addMessage({ role: "assistant", content: responseText });
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            get().addMessage({
              role: "assistant",
              content: "Sorry, something went wrong. Please try again.",
            });
          }
        } finally {
          if (get().abortController === newController) {
            set({ isTyping: false, abortController: null });
          }
        }
      },

      sendMessage: async (content: string) => {
        const { clinicId, sessionToken, messages, abortController } = get();
        if (!clinicId || !sessionToken) return;

        // Cancel any in-flight request
        if (abortController) abortController.abort();
        const newController = new AbortController();
        set({ abortController: newController });

        // Add user message optimistically
        get().addMessage({ role: "user", content });
        set({ isTyping: true });

        const updated = get().messages;

        try {
          let reply = "";
          let attempt = 0;

          while (attempt < 3) {
            try {
              const res = await fetch("/api/widget/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clinicId,
                  sessionToken,
                  language: "en",
                  messages: updated.map((m) => ({ role: m.role, content: m.content })),
                }),
                signal: newController.signal,
              });

              if (!res.ok) throw new Error("API Error");
              const data = await res.json();
              reply = data.reply;
              break;
            } catch (err: unknown) {
              if (err instanceof Error && err.name === "AbortError") throw err;
              attempt++;
              if (attempt >= 3) throw new Error("Failed after 3 attempts");
              await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
            }
          }

          // Parse BOOKING_READY signal from AI
          const match = reply.match(/BOOKING_READY:(.*)/);
          if (match?.[1]) {
            try {
              const bookingData = JSON.parse(match[1].trim()) as BookingData;
              set({ isBookingReady: true, bookingData });
              const cleanedReply = reply.replace(/BOOKING_READY:(.*)/, "").trim();
              get().addMessage({
                role: "assistant",
                content: cleanedReply || "Please review the details below:",
              });
            } catch {
              get().addMessage({ role: "assistant", content: reply });
            }
          } else {
            get().addMessage({ role: "assistant", content: reply });
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            get().addMessage({
              role: "assistant",
              content: "Sorry, something went wrong. Please try again.",
            });
          }
        } finally {
          if (get().abortController === newController) {
            set({ isTyping: false, abortController: null });
          }
        }
      },

      confirmBooking: async () => {
        const { clinicId, bookingData } = get();
        if (!clinicId || !bookingData) return;

        try {
          let phone = (bookingData.phone ?? "").replace(/\D/g, "");
          if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);

          const res = await fetch("/api/widget/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clinicId,
              patientName: bookingData.name,
              patientPhone: phone,
              patientEmail: bookingData.email || "",
              serviceId: bookingData.serviceId,
              appointmentDate: bookingData.date,
              startTime: bookingData.time,
              booking_language: "en",
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to book");
          }

          set({ bookingComplete: true, isBookingReady: false });
          get().addMessage({
            role: "assistant",
            content: "Your appointment has been confirmed! 🎉 You'll receive a confirmation shortly.",
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Please try again later.";
          get().addMessage({
            role: "assistant",
            content: `There was a problem confirming your booking: ${message}`,
          });
        }
      },

      setBookingComplete: (val) => set({ bookingComplete: val }),

      hydrate: () => {
        // Side-effects on hydration if needed
      },
    }),
    {
      name: "prime-health-widget-v3",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} })
      ),
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        clinicId: state.clinicId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.sessionToken) {
          state.sessionToken = uuidv4();
        }
      },
    }
  )
);
