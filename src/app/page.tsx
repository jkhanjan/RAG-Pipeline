"use client";

import { useState, useRef } from "react";
import { Citation } from "@/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadStatus("Please upload a PDF file");
      return;
    }

    setUploading(true);
    setUploadStatus("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setUploadStatus(`${data.message || "File uploaded successfully!"}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setUploadStatus(`${data.error || "Upload failed"}`);
      }
    } catch {
      setUploadStatus("Failed to upload file");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(""), 5000);
    }
  }

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
    <main className="max-w-[50vw] mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">RAG Trial</h1>

      <div className="space-y-6 w-full">
        <div className="flex w-[50vw] items-center gap-2 border rounded-lg px-3 py-2 shadow-sm ">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Upload PDF"
          >
            {uploading ? (
              <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </label>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Ask a question about your documents..."
            className="flex-1 outline-none text-md px-2 py-1 bg-black"
          />

          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {uploadStatus && (
          <div className="text-sm text-gray-600">
            {uploadStatus}
          </div>
        )}

        {answer && (
          <section className="rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Answer</h3>
            <p className="whitespace-pre-wrap text-white">{answer}</p>
          </section>
        )}

        {citations.length > 0 && (
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Citations</h3>
            <ol className="space-y-3">
              {citations.map((c, i) => (
                <li key={i} className="border-l-4 border-blue-200 pl-4">
                  <strong className="text-gray-900">{c.source}</strong>
                  <span className="text-gray-500">, p.{c.page}</span>
                  <br />
                  <span className="text-sm text-gray-600">{c.snippet}...</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}