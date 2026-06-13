'use server'

/**
 * actions/rag.ts
 * Server Actions for the RAG document management feature.
 * All functions require an authenticated doctor session.
 * clinic_id is always derived server-side — never trusted from the client.
 */

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chunkText } from '@/lib/ai/rag'
import { generateEmbedding } from '@/lib/embeddings'
import type { ApiResponse } from '@/types/index'
import type { Tables } from '@/types/supabase'

type RagDocumentRow = Tables<'rag_documents'>

// ─────────────────────────────────────────────
// Internal helper: authenticated clinic ID
// clinic_id == user_id (see Schema.md / clinics table)
// ─────────────────────────────────────────────

async function getAuthenticatedClinicId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ─────────────────────────────────────────────
// Input schemas
// ─────────────────────────────────────────────

const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  sourceType: z.enum(['manual', 'upload']),
})

const documentIdSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
})

const toggleDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  isActive: z.boolean(),
})

// ─────────────────────────────────────────────
// listDocuments
// Returns all rag_documents for the authenticated clinic
// ─────────────────────────────────────────────

export async function listDocuments(): Promise<ApiResponse<RagDocumentRow[]>> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    // Admin client — rag_documents may not have a doctor SELECT RLS policy yet
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('rag_documents')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[listDocuments]', error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ─────────────────────────────────────────────
// uploadDocument
// Inserts document, chunks content, embeds each chunk, inserts chunks
// Embedding calls are sequential to avoid Gemini free-tier rate limits
// ─────────────────────────────────────────────

export async function uploadDocument(
  title: string,
  content: string,
  sourceType: 'manual' | 'upload'
): Promise<ApiResponse<RagDocumentRow>> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    // Validate inputs
    const parsed = uploadDocumentSchema.safeParse({ title, content, sourceType })
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message }
    }

    const admin = createAdminClient()

    // 1. Insert the document record
    const { data: document, error: docError } = await admin
      .from('rag_documents')
      .insert({
        clinic_id: clinicId,
        title: parsed.data.title,
        content: parsed.data.content,
        source_type: parsed.data.sourceType,
        is_active: true,
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('[uploadDocument] insert document', docError)
      return { data: null, error: docError?.message ?? 'Failed to save document' }
    }

    // 2. Chunk the content
    const chunks = chunkText(parsed.data.content)

    // 3. Embed each chunk sequentially (rate-limit safe) and build insert rows
    const chunkRows: Array<{
      clinic_id: string
      document_id: string
      content: string
      embedding: number[]
      token_count: number
      chunk_index: number
    }> = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      // 200 ms delay between calls to avoid Gemini free-tier rate limit
      if (i > 0) {
        await new Promise<void>((r) => setTimeout(r, 200))
      }
      const embedding = await generateEmbedding(chunk)
      chunkRows.push({
        clinic_id: clinicId,
        document_id: document.id,
        content: chunk,
        embedding,
        // approximate token count (1 token ≈ 4 chars)
        token_count: Math.ceil(chunk.length / 4),
        chunk_index: i,
      })
    }

    // 4. Bulk-insert all chunks
    const { error: chunksError } = await admin
      .from('rag_chunks')
      .insert(chunkRows)

    if (chunksError) {
      console.error('[uploadDocument] insert chunks', chunksError)
      // Roll back the document row so we don't have orphaned records
      await admin.from('rag_documents').delete().eq('id', document.id)
      return { data: null, error: 'Failed to embed document chunks' }
    }

    return { data: document, error: null }
  } catch (err) {
    console.error('[uploadDocument]', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ─────────────────────────────────────────────
// deleteDocument
// Removes chunks first, then the parent document
// ─────────────────────────────────────────────

export async function deleteDocument(
  documentId: string
): Promise<ApiResponse<null>> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    const parsed = documentIdSchema.safeParse({ documentId })
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message }
    }

    const admin = createAdminClient()

    // 1. Delete all chunks belonging to this document
    const { error: chunksError } = await admin
      .from('rag_chunks')
      .delete()
      .eq('document_id', parsed.data.documentId)
      .eq('clinic_id', clinicId)

    if (chunksError) {
      console.error('[deleteDocument] delete chunks', chunksError)
      return { data: null, error: 'Failed to delete document chunks' }
    }

    // 2. Delete the document itself (scoped to clinic for safety)
    const { error: docError } = await admin
      .from('rag_documents')
      .delete()
      .eq('id', parsed.data.documentId)
      .eq('clinic_id', clinicId)

    if (docError) {
      console.error('[deleteDocument] delete document', docError)
      return { data: null, error: 'Failed to delete document' }
    }

    return { data: null, error: null }
  } catch (err) {
    console.error('[deleteDocument]', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ─────────────────────────────────────────────
// toggleDocument
// Toggle the is_active flag on a document
// ─────────────────────────────────────────────

export async function toggleDocument(
  documentId: string,
  isActive: boolean
): Promise<ApiResponse<RagDocumentRow>> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    const parsed = toggleDocumentSchema.safeParse({ documentId, isActive })
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message }
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('rag_documents')
      .update({
        is_active: parsed.data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.documentId)
      .eq('clinic_id', clinicId)
      .select()
      .single()

    if (error) {
      console.error('[toggleDocument]', error)
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (err) {
    console.error('[toggleDocument]', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ─────────────────────────────────────────────
// reindexDocument
// Re-chunks + re-embeds an existing document's content
// ─────────────────────────────────────────────

export async function reindexDocument(
  documentId: string
): Promise<ApiResponse<RagDocumentRow>> {
  try {
    const clinicId = await getAuthenticatedClinicId()
    if (!clinicId) return { data: null, error: 'Unauthorized' }

    const parsed = documentIdSchema.safeParse({ documentId })
    if (!parsed.success) {
      return { data: null, error: parsed.error.errors[0].message }
    }

    const admin = createAdminClient()

    // 1. Fetch the existing document
    const { data: document, error: fetchError } = await admin
      .from('rag_documents')
      .select('*')
      .eq('id', parsed.data.documentId)
      .eq('clinic_id', clinicId)
      .single()

    if (fetchError || !document) {
      console.error('[reindexDocument] fetch', fetchError)
      return { data: null, error: 'Document not found' }
    }

    // 2. Delete existing chunks
    const { error: deleteError } = await admin
      .from('rag_chunks')
      .delete()
      .eq('document_id', parsed.data.documentId)
      .eq('clinic_id', clinicId)

    if (deleteError) {
      console.error('[reindexDocument] delete old chunks', deleteError)
      return { data: null, error: 'Failed to clear old chunks' }
    }

    // 3. Re-chunk the document content
    const chunks = chunkText(document.content)

    // 4. Re-embed sequentially
    const chunkRows: Array<{
      clinic_id: string
      document_id: string
      content: string
      embedding: number[]
      token_count: number
      chunk_index: number
    }> = []

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        await new Promise<void>((r) => setTimeout(r, 200))
      }
      const embedding = await generateEmbedding(chunks[i])
      chunkRows.push({
        clinic_id: clinicId,
        document_id: document.id,
        content: chunks[i],
        embedding,
        token_count: Math.ceil(chunks[i].length / 4),
        chunk_index: i,
      })
    }

    // 5. Insert fresh chunks
    const { error: insertError } = await admin
      .from('rag_chunks')
      .insert(chunkRows)

    if (insertError) {
      console.error('[reindexDocument] insert chunks', insertError)
      return { data: null, error: 'Failed to insert re-indexed chunks' }
    }

    // 6. Touch updated_at on the document
    const { data: updated, error: updateError } = await admin
      .from('rag_documents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', document.id)
      .select()
      .single()

    if (updateError) {
      console.error('[reindexDocument] update timestamp', updateError)
      return { data: null, error: 'Failed to update document timestamp' }
    }

    return { data: updated, error: null }
  } catch (err) {
    console.error('[reindexDocument]', err)
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}
