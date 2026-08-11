import { Chunk, ScoredChunk } from "@/types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * BM25 over the full chunk set. Fine for a trial project (hundreds/low
 * thousands of chunks computed on the fly). Swap for a real search index
 * (e.g. Elasticsearch/Typesense/pg full-text) once corpus size grows.
 */
export function bm25Search(chunks: Chunk[], query: string, topK = 10): ScoredChunk[] {
  const k1 = 1.5;
  const b = 0.75;

  const docs = chunks.map((c) => tokenize(c.text));
  const avgLen = docs.reduce((sum, d) => sum + d.length, 0) / (docs.length || 1);

  const df = new Map<string, number>(); // document frequency per term
  docs.forEach((tokens) => {
    const seen = new Set(tokens);
    seen.forEach((t) => df.set(t, (df.get(t) ?? 0) + 1));
  });

  const N = docs.length;
  const idf = (term: string) => {
    const n = df.get(term) ?? 0;
    return Math.log((N - n + 0.5) / (n + 0.5) + 1);
  };

  const queryTerms = tokenize(query);

  const scored = chunks.map((chunk, i) => {
    const tokens = docs[i];
    const termFreq = new Map<string, number>();
    tokens.forEach((t) => termFreq.set(t, (termFreq.get(t) ?? 0) + 1));

    let score = 0;
    for (const term of queryTerms) {
      const tf = termFreq.get(term) ?? 0;
      if (tf === 0) continue;
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + (b * tokens.length) / avgLen);
      score += idf(term) * (numerator / denominator);
    }

    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, topK);
}
