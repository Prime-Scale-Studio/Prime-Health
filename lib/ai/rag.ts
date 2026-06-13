/**
 * lib/ai/rag.ts
 * RAG pipeline utilities: text chunking + context retrieval.
 * SERVER ONLY — never import in client components.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/embeddings'

// ─────────────────────────────────────────────────────────────────────────────
// Text Chunking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split text into overlapping chunks by token approximation.
 * Rule of thumb: 1 token ≈ 4 characters.
 *
 * @param text      - Source text to split
 * @param chunkSize - Target chunk size in tokens (default: 500)
 * @param overlap   - Number of tokens to overlap between consecutive chunks (default: 50)
 * @returns Array of text strings, each ≤ chunkSize tokens
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] {
  const CHARS_PER_TOKEN = 4

  // Convert token counts to char counts
  const chunkChars = chunkSize * CHARS_PER_TOKEN
  const overlapChars = overlap * CHARS_PER_TOKEN

  if (text.length <= chunkChars) {
    return [text.trim()].filter(Boolean)
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkChars, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    // Advance by chunkSize minus overlap so chunks share content at boundaries
    start += chunkChars - overlapChars
  }

  return chunks
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Retrieval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve the most relevant knowledge-base chunks for a given query.
 *
 * @param clinicId - Owning clinic UUID
 * @param query    - User/system query text
 * @param topK     - Maximum number of chunks to return (default: 5)
 * @returns Concatenated chunk content joined by double newlines, or '' if none found
 */
export async function retrieveContext(
  clinicId: string,
  query: string,
  topK: number = 5
): Promise<string> {
  // Null safety: empty query — skip entirely
  if (!query.trim()) return ''

  let embedding: number[]
  try {
    embedding = await generateEmbedding(query)
  } catch (embeddingErr) {
    console.error('[RAG] embedding generation failed:', embeddingErr)
    return ''
  }

  const supabase = createAdminClient()

  const { data: chunks, error } = await supabase.rpc('match_rag_chunks', {
    p_clinic_id: clinicId,
    p_embedding: embedding,
    p_match_count: topK,
    p_similarity_threshold: 0.7,
  })

  if (error) {
    console.error('[RAG] retrieval failed:', error)
    return ''
  }

  if (!chunks?.length) return ''

  return chunks.map((c) => c.content).join('\n\n')
}
