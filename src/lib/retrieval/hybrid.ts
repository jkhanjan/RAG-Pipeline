import { Chunk, ScoredChunk } from "@/types";
import { denseSearch } from "./dense";
import { bm25Search } from "./sparse";

/**
 * Reciprocal Rank Fusion: combines two ranked lists using only rank position
 * (not raw scores, which live on different scales for BM25 vs cosine sim).
 * This is the standard, simple way to fuse dense + sparse results.
 */
function reciprocalRankFusion(
  rankings: ScoredChunk[][],
  k = 60 // RRF constant; 60 is the commonly used default
): ScoredChunk[] {
  const fused = new Map<string, { chunk: ScoredChunk; score: number }>();

  for (const ranking of rankings) {
    ranking.forEach((chunk, rank) => {
      const contribution = 1 / (k + rank + 1);
      const existing = fused.get(chunk.id);
      if (existing) {
        existing.score += contribution;
      } else {
        fused.set(chunk.id, { chunk, score: contribution });
      }
    });
  }

  return Array.from(fused.values())
    .sort((a, b) => b.score - a.score)
    .map(({ chunk, score }) => ({ ...chunk, score }));
}

export async function hybridSearch(chunks: Chunk[], query: string, topK = 10): Promise<ScoredChunk[]> {
  const [dense, sparse] = await Promise.all([
    denseSearch(chunks, query, topK * 2),
    Promise.resolve(bm25Search(chunks, query, topK * 2)),
  ]);

  return reciprocalRankFusion([dense, sparse]).slice(0, topK);
}
