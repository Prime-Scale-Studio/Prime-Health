import type { Metadata } from 'next'
import { listDocuments } from '@/actions/rag'
import { RAGDocumentManager } from '@/components/ai/RAGDocumentManager'

export const metadata: Metadata = {
  title: 'AI Training | Prime Health',
  description:
    'Upload documents to train your AI assistant with clinic-specific knowledge.',
}

export default async function AiTrainingPage() {
  const docsRes = await listDocuments()

  if (docsRes.error) {
    return (
      <div className="p-8 text-center text-destructive">
        Error loading documents: {docsRes.error}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-10 pb-16">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AI Training
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your AI assistant&apos;s knowledge base. Documents you add here are
          chunked, embedded, and used during patient conversations to provide
          clinic-specific, accurate responses.
        </p>
      </div>

      {/* Knowledge Base Documents section */}
      <section aria-labelledby="rag-docs-heading">
        <div className="mb-4">
          <h2
            id="rag-docs-heading"
            className="text-xl font-semibold text-foreground"
          >
            Knowledge Base Documents
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents to train your AI assistant with clinic-specific
            knowledge
          </p>
        </div>

        <RAGDocumentManager initialDocuments={docsRes.data ?? []} />
      </section>
    </div>
  )
}
