"use client";

import React, { useState } from "react";
import { WidgetConfig } from "./widget-config";
import { WidgetPreview } from "./widget-preview";
import { EmbedCode } from "./embed-code";
import { KnowledgeBase } from "./knowledge-base";
import { RAGDocumentManager } from "@/components/ai/RAGDocumentManager";
import { toast } from "sonner";
import { updateWidgetSettings } from "@/actions/clinic";
import type { Tables } from "@/types/supabase";

type RagDocument = Tables<"rag_documents">;

export function AiSettingsClient({ 
  initialClinic, 
  initialKnowledge,
  initialRagDocuments,
  activeSessions
}: { 
  initialClinic: any; 
  initialKnowledge: any[];
  initialRagDocuments: RagDocument[];
  activeSessions: number;
}) {
  const [clinic, setClinic] = useState(initialClinic || {});
  
  const handleConfigChange = async (fields: { widget_theme_color?: string, widget_tone?: string, language?: "en" | "hi" }) => {
    // Optimistic update for UI responsiveness
    setClinic((prev: any) => ({ ...prev, ...fields }));
    
    // Server update
    const { error } = await updateWidgetSettings(fields);
    if (error) {
      toast.error(error);
      // Revert on error
      setClinic(initialClinic);
    }
  };

  if (!initialClinic) {
    return <div className="p-8 text-center text-muted-foreground">Unable to load clinic profile.</div>;
  }

  return (
    <div className="space-y-10 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Customize your widget's appearance, set your AI's tone, and train its knowledge base.
          </p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Active widget sessions: {activeSessions}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-8">
          <WidgetConfig 
            clinic={clinic} 
            onChange={handleConfigChange} 
          />
          <EmbedCode clinicSlug={clinic.slug || clinic.id} clinicId={clinic.id} />
        </div>
        
        <div className="xl:col-span-8">
          <WidgetPreview clinic={clinic} />
        </div>
      </div>

      <hr className="border-border" />

      {/* RAG document knowledge — vector search */}
      <section aria-labelledby="rag-knowledge-heading" className="space-y-4">
        <div>
          <h2 id="rag-knowledge-heading" className="text-xl font-semibold text-foreground">
            RAG Knowledge Base
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload clinic documents (FAQs, policies, post-op instructions). The AI uses
            vector search to pull relevant sections during patient conversations.
          </p>
        </div>
        <RAGDocumentManager initialDocuments={initialRagDocuments} />
      </section>

      <hr className="border-border" />

      {/* Manual FAQ entries */}
      <section aria-labelledby="faq-knowledge-heading" className="space-y-4">
        <div>
          <h2 id="faq-knowledge-heading" className="text-xl font-semibold text-foreground">
            FAQ Knowledge
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add question-and-answer pairs that are always available to the widget AI.
          </p>
        </div>
        <KnowledgeBase initialKnowledge={initialKnowledge} />
      </section>
    </div>
  );
}
