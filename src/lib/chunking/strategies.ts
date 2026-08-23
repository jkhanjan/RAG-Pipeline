import { Chunk } from "@/types";

/**
 * Very rough token estimate (~4 chars per token for English).
 * Good enough for chunk sizing without pulling in a tokenizer.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface PageInput {
  page: number;
  text: string;
}

export interface ChunkOptions {
  chunkTokens?: number;   // target chunk size in tokens
  overlapTokens?: number; // overlap between consecutive chunks
}

/**
 * Splits per-page text into overlapping chunks of ~chunkTokens size.
 * Keeps a single page per chunk so page-numbered citations stay accurate.
 * (If a chunk needs to span pages, extend this to carry a page range instead.)
 */
export function chunkPages(
  docId: string,
  source: string,
  pages: PageInput[],
  { chunkTokens = 500, overlapTokens = 50 }: ChunkOptions = {}
): Chunk[] {
  const chunks: Chunk[] = [];
  const charsPerChunk = chunkTokens * 4;
  const overlapChars = overlapTokens * 4;

  for (const { page, text } of pages) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) continue;

    let start = 0;
    let idx = 0;
    while (start < clean.length) {
      const end = Math.min(start + charsPerChunk, clean.length);
      const slice = clean.slice(start, end);

      chunks.push({
        id: `${docId}-p${page}-${idx}`,
        docId,
        source,
        page,
        text: slice,
      });

      if (end === clean.length) break;
      start = end - overlapChars;
      idx++;
    }
  }

  return chunks;
}

/**
 * Why 500 tokens / 50 overlap:
 * - 500 tokens (~2000 chars) is small enough to keep retrieval precise
 *   (a chunk is about one paragraph/idea) but large enough to preserve context.
 * - 50 token overlap (10%) prevents losing meaning at chunk boundaries when a
 * Tune chunkTokens down (~200-300) for dense reference text (specs, tables),
 * up (~800) for narrative text where broader context helps.
 */
export { estimateTokens };
