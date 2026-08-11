"use client";

import { useState } from "react";
import { Citation } from "@/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer("");
    setCitations([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error ?? "No answer.");
      setCitations(data.citations ?? []);
    } catch {
      setAnswer("Something went wrong calling /api/chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>RAG Trial</h1>
      <p style={{ color: "#666" }}>
        Ingest documents via <code>POST /api/ingest</code>, then ask questions here.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask a question about your documents..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleAsk} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "..." : "Ask"}
        </button>
      </div>

      {answer && (
        <section style={{ marginTop: 24 }}>
          <h3>Answer</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
        </section>
      )}

      {citations.length > 0 && (
        <section style={{ marginTop: 16 }}>
          <h3>Citations</h3>
          <ol>
            {citations.map((c, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{c.source}</strong>, p.{c.page}
                <br />
                <span style={{ color: "#666", fontSize: 14 }}>{c.snippet}...</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
