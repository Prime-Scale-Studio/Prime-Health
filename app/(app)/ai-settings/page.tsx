import { getMyClinic } from "@/actions/clinic";
import { getKnowledgeBase, getActiveChatSessionsCount } from "@/actions/settings";
import { listDocuments } from "@/actions/rag";
import { AiSettingsClient } from "@/components/ai-settings/ai-settings-client";
import { RealtimeSubscriber } from "@/components/layout/realtime-subscriber";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Settings | Prime Health",
  description: "Configure your AI assistant's knowledge and behavior.",
};

export default async function AiSettingsPage() {
  const [clinicRes, knowledgeRes, ragDocsRes, activeSessionsRes] = await Promise.all([
    getMyClinic(),
    getKnowledgeBase(),
    listDocuments(),
    getActiveChatSessionsCount(),
  ]);

  if (clinicRes.error || !clinicRes.data) {
    return <div className="p-8 text-center text-red-500">Error loading clinic: {clinicRes.error || "Not found"}</div>;
  }
  if (knowledgeRes.error) {
    return <div className="p-8 text-center text-red-500">Error loading knowledge base: {knowledgeRes.error}</div>;
  }
  if (ragDocsRes.error) {
    return <div className="p-8 text-center text-red-500">Error loading RAG documents: {ragDocsRes.error}</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <RealtimeSubscriber clinicId={clinicRes.data.id} enableChatSessions />
      <AiSettingsClient 
        initialClinic={clinicRes.data}
        initialKnowledge={knowledgeRes.data || []}
        initialRagDocuments={ragDocsRes.data || []}
        activeSessions={activeSessionsRes.data || 0}
      />
    </div>
  );
}
