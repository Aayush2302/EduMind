// rag-worker/src/services/embedder.ts (Jina AI v3 - FREE)

export interface EmbeddingResult {
  embedding: number[];
}

// Jina AI v3 embeddings with 384 dimensions
const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY || ""; // Get from https://jina.ai/

export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        task: "text-matching",
        dimensions: 384,
        input: [text]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      embedding: data.data[0].embedding
    };
  } catch (error) {
    console.error("❌ [Embedder] Failed:", error);
    throw new Error("Embedding generation failed");
  }
}

export async function generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];

  try {
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        task: "text-matching",
        dimensions: 384, // Same as MiniLM for compatibility
        input: texts
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return data.data.map((item: any) => ({
      embedding: item.embedding
    }));
  } catch (error) {
    console.error("❌ [Embedder] Batch failed:", error);
    throw new Error("Batch embedding failed");
  }
}