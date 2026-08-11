import { Chunk, ScoredChunk } from "@/types";
import { cosineSimilarity } from "@/lib/embeddings/embed";
import { embedWithCache } from "@/lib/embeddings/cache";

/**
 * Brute-force cosine similarity over all chunks. Fine up to a few thousand
 * chunks; swap for an ANN index (HNSW via pgvector/Faiss/etc) beyond that.
 */
export async function denseSearch(chunks: Chunk[], query: string, topK = 10): Promise<ScoredChunk[]> {
  const queryEmbedding = await embedWithCache(query);

  const scored = chunks
    .filter((c) => c.embedding && c.embedding.length > 0)
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding as number[]) }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
