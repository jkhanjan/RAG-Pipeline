# RAG Trial Project

## What's already working

- **Chunking** — `src/lib/chunking/strategies.ts` — 500 token / 50 token overlap, one page per chunk (page number preserved for citations).
- **Embeddings** — `src/lib/embeddings/embed.ts` — local model (`@xenova/transformers`, all-MiniLM-L6-v2), free, no API key, runs on first call (downloads model, then cached).
- **Embedding cache** — `src/lib/embeddings/cache.ts` — hash-keyed in-memory cache so repeat text isn't re-embedded.
- **Sparse retrieval (BM25)** — `src/lib/retrieval/sparse.ts`
- **Dense retrieval (cosine)** — `src/lib/retrieval/dense.ts`
- **Hybrid retrieval (RRF fusion)** — `src/lib/retrieval/hybrid.ts`
- **Generation with citation grounding** — `src/lib/generation/groq.ts` — Groq (`openai/gpt-oss-120b`), system prompt forces `[n]`-style citations tied to retrieved passages, refuses when context doesn't contain the answer.
- **Storage** — `src/lib/db/vector-store.ts` — Supabase `public.chunks` table with pgvector embeddings.
- **API routes** — `POST /api/ingest` (chunk + embed + store), `POST /api/chat` (hybrid search → Groq → answer + citations).
- **UI** — `src/app/page.tsx` — minimal ask box + citation list.

## Setup

```bash
cp .env.local.example .env.local   # add your GROQ_API_KEY
npm run dev
```

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor before uploading a PDF. It creates the `chunks` table, enables pgvector with the 384 dimensions used by `all-MiniLM-L6-v2`, and adds the required RLS policy.

Ingest a doc:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"docId":"doc1","source":"test.pdf","pages":[{"page":1,"text":"Your extracted page text here."}]}'
```

Then open http://localhost:3000 and ask a question.

## Not built yet — suggested build order

1. **Eval harness** (`src/lib/eval/`) — write 50 golden (query, expected source/page) pairs first, before adding more retrieval features. You need this to know if reranking/expansion actually help.
2. **Cross-encoder reranking** — rerank hybrid's top ~20 down to top 5 before generation. Free option: `Xenova/ms-marco-MiniLM-L-6-v2` via `@xenova/transformers` (already installed), same pattern as `embed.ts`.
3. **Query rewriting / expansion** — one extra Groq call before retrieval to rewrite ambiguous queries or add synonyms.
4. **Metadata filtering** — add a `filters` field to chunks (e.g. doc type, date) and filter `loadChunks()` results before search.
5. **Confidence + web fallback** — threshold on top hybrid score; below it, call a web search API instead of answering from context.
6. **Retrieval metrics dashboard** — once the eval harness exists, compute hit rate / MRR / NDCG per run and chart them.
7. **Parent document retrieval / ColBERT** — bigger lifts, do these last once the basic pipeline is benchmarked.

## Why this structure

Each retrieval technique is its own file under `src/lib/retrieval/`, so `hybrid.ts` composes `dense.ts` + `sparse.ts` without them knowing about each other. Adding reranking means adding `rerank.ts` and calling it after `hybridSearch()` — nothing above it changes.
