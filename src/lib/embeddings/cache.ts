import { createHash } from "crypto";
import { embedText } from "./embed";

// Process-memory cache. Swap for Redis/SQLite once this runs across
// multiple server instances or needs to survive restarts.
const cache = new Map<string, number[]>();

function keyFor(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function embedWithCache(text: string): Promise<number[]> {
  const key = keyFor(text);
  const hit = cache.get(key);
  if (hit) return hit;

  const embedding = await embedText(text);
  cache.set(key, embedding);
  return embedding;
}

export function cacheStats() {
  return { size: cache.size };
}
