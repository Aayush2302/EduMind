// rag-worker/src/services/pdf.extractor.ts
import pdf from 'pdf-parse-fork';

export interface PageChunk {
  pageNumber: number;
  chunkIndex: number;
  content: string;
}

function cleanText(text: string): string {
  return text
    .replace(/[^\S\r\n]+/g, " ") // Remove extra spaces
    .replace(/\n\s*\n/g, "\n")    // Collapse multiple newlines
    .trim();
}

/**
 * Extracts text and processes it in batches to stay under Render's 512MB limit.
 */
export async function extractAndProcessPdf(
  buffer: Buffer,
  onBatchReady: (chunks: PageChunk[]) => Promise<void>,
  options: { chunkSize: number; overlap: number }
): Promise<{ pageCount: number }> {
  
  // 1. Extract raw text using the fork (handles TS/ESM correctly)
  const data = await pdf(buffer);
  const totalPages = data.numpages;
  
  // 2. Clear original buffer immediately to free RAM
  buffer.fill(0); 

  const cleanedText = cleanText(data.text);
  const words = cleanedText.split(/\s+/);
  
  let chunks: PageChunk[] = [];
  let chunkIndex = 0;

  // 3. Sliding window chunking logic
  // 
  for (let i = 0; i < words.length; i += (options.chunkSize - options.overlap)) {
    const content = words.slice(i, i + options.chunkSize).join(" ");
    
    chunks.push({
      pageNumber: 0, 
      chunkIndex: chunkIndex++,
      content: content
    });

    // 4. Batch processing: Only keep 5 chunks in memory at a time
    if (chunks.length >= 5) {
      await onBatchReady(chunks);
      chunks.length = 0; // Clear array while keeping reference
      
      if (global.gc) {
        global.gc(); // Manually trigger GC to keep heap low
      }
    }
  }

  // Handle remaining chunks
  if (chunks.length > 0) {
    await onBatchReady(chunks);
  }

  return { pageCount: totalPages };
}