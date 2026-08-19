import { NextRequest, NextResponse } from "next/server";
import { loadChunks } from "@/lib/db/vector-store";
import { hybridSearch } from "@/lib/retrieval/hybrid";
import { generateAnswer } from "@/lib/generation/groq";
import { Citation } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const chunks = await loadChunks();
    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "No documents have been ingested yet. Call /api/ingest first.",
        citations: [],
      });
    }

    const topChunks = await hybridSearch(chunks, query, 5);
    const answer = await generateAnswer(query, topChunks);

    const citations: Citation[] = topChunks.map((c) => ({
      source: c.source,
      page: c.page,
      snippet: c.text.slice(0, 200),
    }));

    return NextResponse.json({ answer, citations });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
