"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface RealtimeSubscriberProps {
  clinicId: string;
  enableAppointments?: boolean;
  enableChatSessions?: boolean;
}

export function RealtimeSubscriber({ 
  clinicId, 
  enableAppointments = false, 
  enableChatSessions = false 
}: RealtimeSubscriberProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channels: any[] = [];

    if (enableAppointments) {
      const appointmentsChannel = supabase.channel('appointments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `clinic_id=eq.${clinicId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              toast.success(`New appointment booked by ${payload.new.patient_name || 'a patient'}`);
            } else if (payload.eventType === 'UPDATE') {
              // Optional: notify on status change if it wasn't done by the dashboard user themselves
              // But to avoid spam, we just silently refresh the data
            }
            router.refresh();
          }
        )
        .subscribe();
      channels.push(appointmentsChannel);
    }

    if (enableChatSessions) {
      const chatSessionsChannel = supabase.channel('chat_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_sessions',
            filter: `clinic_id=eq.${clinicId}`,
          },
          () => {
            router.refresh();
          }
        )
        .subscribe();
      channels.push(chatSessionsChannel);
    }

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [clinicId, enableAppointments, enableChatSessions, router]);

  return null;
}
