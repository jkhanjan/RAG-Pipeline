import { Groq } from "groq-sdk";
import { ScoredChunk } from "@/types";

const groq = new Groq(); // reads GROQ_API_KEY from env automatically

const SYSTEM_PROMPT = `You are a RAG assistant. Answer ONLY using the numbered context
passages provided below. Every factual claim must end with a citation in the
form [n] referring to the passage number it came from.

Rules:
- If the answer is not contained in the context, say "I don't have enough
  information in the provided documents to answer that." Do not guess.
- Never invent a citation number that wasn't provided.
- Keep answers concise and directly grounded in the cited passages.`;

function buildContextBlock(chunks: ScoredChunk[]): string {
  return chunks
    .map((c, i) => `[${i + 1}] (source: ${c.source}, page ${c.page})\n${c.text}`)
    .join("\n\n");
}

export function buildMessages(query: string, chunks: ScoredChunk[]) {
  const context = buildContextBlock(chunks);
  return [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Context passages:\n\n${context}\n\nQuestion: ${query}`,
    },
  ];
}

/**
 * Non-streaming call — simplest path, good for the API route to start with.
 */
export async function generateAnswer(query: string, chunks: ScoredChunk[]) {
  const completion = await groq.chat.completions.create({
    messages: buildMessages(query, chunks),
    model: "openai/gpt-oss-120b",
    temperature: 0.2, // low temp: grounded/citation-heavy answers, not creative ones
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Streaming variant — use this from a route that returns a ReadableStream
 * once you want token-by-token output in the UI.
 */
export async function* streamAnswer(query: string, chunks: ScoredChunk[]) {
  const stream = await groq.chat.completions.create({
    messages: buildMessages(query, chunks),
    model: "openai/gpt-oss-120b",
    temperature: 0.2,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
