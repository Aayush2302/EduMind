// rag-worker/src/services/vector.store.ts
import { supabaseAdmin } from "../config/supabase.js";

export interface VectorChunk {
  documentId: string;
  userId: string;
  chatId: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  embedding: number[];
}

/**
 * Batch insert vectors - OPTIMIZED
 */
export async function storeBatchVectors(chunks: VectorChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  const rows = chunks.map(chunk => ({
    document_id: chunk.documentId,
    user_id: chunk.userId,
    chat_id: chunk.chatId,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    embedding: chunk.embedding,
  }));

  const { error } = await supabaseAdmin
    .from("document_chunks")
    .insert(rows);

  if (error) {
    console.error("❌ [VectorStore] Batch insert failed:", error);
    throw new Error("Failed to store vectors");
  }
}

/**
 * Delete all vectors for a document
 */
export async function deleteDocumentVectors(documentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("document_chunks")
    .delete()
    .eq("document_id", documentId);

  if (error) {
    console.error("❌ [VectorStore] Delete failed:", error);
    throw new Error("Failed to delete vectors");
  }
}