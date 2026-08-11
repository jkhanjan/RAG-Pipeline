import fs from "fs";
import path from "path";
import { Chunk } from "@/types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

function ensureStoreFile() {
  if (!fs.existsSync(path.dirname(STORE_PATH))) {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify([]));
  }
}

export function loadChunks(): Chunk[] {
  ensureStoreFile();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  return JSON.parse(raw) as Chunk[];
}

export function saveChunks(chunks: Chunk[]) {
  ensureStoreFile();
  fs.writeFileSync(STORE_PATH, JSON.stringify(chunks));
}

export function appendChunks(newChunks: Chunk[]) {
  const existing = loadChunks();
  saveChunks([...existing, ...newChunks]);
}

export function clearStore() {
  saveChunks([]);
}
