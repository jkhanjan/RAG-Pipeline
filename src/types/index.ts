export interface Chunk {
  id: string;
  docId: string;
  source: string;      // filename or doc title
  page: number;        // page number for citation
  text: string;
  embedding?: number[];
}

export interface ScoredChunk extends Chunk {
  score: number;
}

export interface Citation {
  source: string;
  page: number;
  snippet: string;
}

export interface RagAnswer {
  answer: string;
  citations: Citation[];
}
