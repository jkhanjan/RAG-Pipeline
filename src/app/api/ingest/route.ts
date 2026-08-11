import { NextRequest, NextResponse } from "next/server";
import { chunkPages, PageInput } from "@/lib/chunking/strategies";
import { embedWithCache } from "@/lib/embeddings/cache";
import { appendChunks } from "@/lib/db/vector-store";

/**
 * Expected body:
 * {
 *   "docId": "handbook-2026",
 *   "source": "Employee Handbook.pdf",
 *   "pages": [{ "page": 1, "text": "..." }, { "page": 2, "text": "..." }]
 * }
 *
 * For a trial project, extract page text yourself (e.g. pdf-parse) before
 * calling this route — keeping PDF parsing out of this route keeps it simple.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docId, source, pages } = body as { docId: string; source: string; pages: PageInput[] };

    if (!docId || !source || !Array.isArray(pages)) {
      return NextResponse.json(
        { error: "Body must include docId, source, and pages[]" },
        { status: 400 }
      );
    }

    const chunks = chunkPages(docId, source, pages, { chunkTokens: 500, overlapTokens: 50 });

    for (const chunk of chunks) {
      chunk.embedding = await embedWithCache(chunk.text);
    }

    appendChunks(chunks);

    return NextResponse.json({ ingested: chunks.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ingest failed" }, { status: 500 });
  }
}
