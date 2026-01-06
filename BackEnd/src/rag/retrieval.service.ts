// backend/src/services/rag/retrieval.service.ts
import { supabaseAdmin } from "../config/supabase.js";

export interface RetrievedChunk {
  documentId: string;
  pageNumber: number;
  content: string;
  similarity: number;
}

/**
 * Generate embedding for user query
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const JINA_API_KEY = process.env.JINA_API_KEY!;
  
  const response = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${JINA_API_KEY}`
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      task: "text-matching",
      dimensions: 384,
      input: [query]
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate query embedding");
  }

  const data = await response.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

/**
 * Search for relevant document chunks using vector similarity
 */
export async function retrieveRelevantChunks(
  chatId: string,
  query: string,
  topK: number = 5
): Promise<RetrievedChunk[]> {
  try {
    console.log("🔍 [RAG] Searching for relevant chunks...");

    // 1. Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(query);

    // 2. Search in Supabase using pgvector
    const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_chat_id: chatId,
      match_count: topK
    });

    if (error) {
      console.error("❌ [RAG] Search failed:", error);
      throw new Error("Vector search failed");
    }

    if (!data || data.length === 0) {
      console.log("ℹ️ [RAG] No relevant chunks found");
      return [];
    }

    console.log(`✅ [RAG] Found ${data.length} relevant chunks`);

    return data.map((item: any) => ({
      documentId: item.document_id,
      pageNumber: item.page_number,
      content: item.content,
      similarity: item.similarity
    }));
  } catch (error) {
    console.error("❌ [RAG] Retrieval failed:", error);
    return [];
  }
}

/**
 * Format retrieved chunks into context string for LLM
 */
export function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const contextParts = chunks.map((chunk, idx) => 
    `[Document ${idx + 1}, Page ${chunk.pageNumber + 1}, Similarity: ${(chunk.similarity * 100).toFixed(1)}%]:\n${chunk.content}`
  );

  return `DOCUMENT CONTEXT:\n\n${contextParts.join("\n\n---\n\n")}\n\nEND OF DOCUMENT CONTEXT`;
}