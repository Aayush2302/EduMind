// rag-worker/src/pipeline/rag.pipeline.ts
import { supabaseAdmin } from "../config/supabase.js";
import { extractAndProcessPdf, PageChunk } from "../services/pdf.extractor.js";
import { generateBatchEmbeddings } from "../services/embedder.js";
import { storeBatchVectors, VectorChunk } from "../services/vector.store.js";

export interface PipelineResult {
  success: boolean;
  pageCount: number;
  totalChunks: number;
  error?: string;
}

/**
 * Main RAG Pipeline optimized for low-memory environments
 */
export async function processDocumentRAG(
  documentId: string,
  userId: string,
  chatId: string,
  storagePath: string
): Promise<PipelineResult> {
  console.log(`🚀 [RAG Pipeline] Starting: ${documentId}`);

  let totalChunksProcessed = 0;

  try {
    // 1. Download PDF from Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .download(storagePath);

    if (error) throw new Error(`Download failed: ${error.message}`);

    // 2. Convert to Buffer and immediately nullify the source data to save RAM
    let buffer: Buffer | null = Buffer.from(await data.arrayBuffer());
    console.log(`📦 PDF Downloaded. Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // 3. Extract and Process via Stream-like callback
    const { pageCount } = await extractAndProcessPdf(
      buffer,
      async (chunks: PageChunk[]) => {
        // This callback handles small batches (e.g., 5 chunks at a time)
        await handleBatchProcessing(chunks, documentId, userId, chatId);
        totalChunksProcessed += chunks.length;
      },
      { chunkSize: 250, overlap: 30 }
    );

    // 4. Final Cleanup of the main buffer
    if (buffer) {
      buffer.fill(0);
      buffer = null;
    }

    console.log(`✅ [RAG] Complete: ${pageCount} pages, ${totalChunksProcessed} chunks.`);
    return { success: true, pageCount, totalChunks: totalChunksProcessed };

  } catch (error) {
    console.error("❌ [RAG Pipeline] Fatal Error:", error);
    return {
      success: false,
      pageCount: 0,
      totalChunks: 0,
      error: error instanceof Error ? error.message : "Unknown pipeline error",
    };
  } finally {
    // Final attempt to clear heap
    if (global.gc) global.gc();
  }
}

/**
 * Helper to process a small batch of chunks: Embed -> Store -> Clear
 */
async function handleBatchProcessing(
  chunks: PageChunk[],
  documentId: string,
  userId: string,
  chatId: string
): Promise<void> {
  try {
    const texts = chunks.map(c => c.content);

    // Generate embeddings via HuggingFace
    const embeddings = await generateBatchEmbeddings(texts);

    // Map to VectorStore format
    const vectorChunks: VectorChunk[] = chunks.map((chunk, idx) => ({
      documentId,
      userId,
      chatId,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      embedding: embeddings[idx].embedding,
    }));

    // Batch insert into Supabase/Postgres
    await storeBatchVectors(vectorChunks);
    
    console.log(`  📊 Stored batch: ${chunks.length} chunks`);

    // CRITICAL: Explicitly clear array references for Garbage Collection
    texts.length = 0;
    vectorChunks.length = 0;
    embeddings.length = 0;

    // Trigger GC if exposed (requires --expose-gc flag)
    if (global.gc) global.gc();

  } catch (error) {
    console.error("  ❌ [Batch Error]:", error);
    throw error; // Re-throw to stop pipeline on DB/API failure
  }
}