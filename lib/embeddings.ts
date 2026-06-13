/**
 * lib/embeddings.ts
 * Gemini text-embedding-004 REST client.
 * SERVER ONLY — never import this in client components.
 */

const GEMINI_EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent'

interface GeminiEmbeddingResponse {
  embedding: {
    values: number[]
  }
}

/**
 * Generate a 768-dimension embedding for the given text using Gemini text-embedding-004.
 *
 * @param text - Plain text to embed (will be truncated by the API if too long)
 * @returns Array of 768 floats
 * @throws Error with descriptive message on failure
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      '[generateEmbedding] GEMINI_API_KEY is not set. Add it to .env.local.'
    )
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [{ text }],
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    throw new Error(
      `[generateEmbedding] Gemini API error ${response.status}: ${errorBody}`
    )
  }

  const data = (await response.json()) as GeminiEmbeddingResponse

  if (!data?.embedding?.values?.length) {
    throw new Error(
      '[generateEmbedding] Unexpected response shape — embedding.values missing.'
    )
  }

  return data.embedding.values
}
