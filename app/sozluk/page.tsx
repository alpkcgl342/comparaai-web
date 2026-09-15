"use client";

import { useEffect, useState } from "react";
import {
  AI_SERVICE_URL,
  getGlossaryList,
  getGlossaryTerm,
  saveGlossaryTerm,
  type GlossaryTerm,
} from "@/lib/api";
import {
  EXPERTISE_LEVELS,
  getStoredExpertiseLevel,
  setStoredExpertiseLevel,
  type ExpertiseLevel,
} from "@/lib/expertiseLevel";

const LEVEL_FIELD: Record<ExpertiseLevel, keyof GlossaryTerm> = {
  basit: "explanationSimple",
  normal: "explanationNormal",
  teknik: "explanationTechnical",
  uzman: "explanationExpert",
};

type Result = {
  term: string;
  explanation: string;
  category?: string | null;
  relatedTerms?: string[];
};

export default function SozlukPage() {
  const [level, setLevel] = useState<ExpertiseLevel>("normal");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popularTerms, setPopularTerms] = useState<
    { id: string; term: string; category?: string | null }[]
  >([]);

  useEffect(() => {
    setLevel(getStoredExpertiseLevel());
    getGlossaryList()
      .then(setPopularTerms)
      .catch((err) => console.error("Terim listesi alınamadı:", err));
  }, []);

  function handleLevelChange(newLevel: ExpertiseLevel) {
    setLevel(newLevel);
    setStoredExpertiseLevel(newLevel);
    // Aynı terim için seviyeyi değiştirince otomatik yeniden ara.
    if (result) {
      void lookup(result.term, newLevel);
    }
  }

  async function lookup(term: string, forLevel: ExpertiseLevel) {
    const trimmed = term.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const cached = await getGlossaryTerm(trimmed);
      const field = LEVEL_FIELD[forLevel];
      const cachedExplanation = cached?.[field] as string | null | undefined;

      if (cached && cachedExplanation) {
        setResult({
          term: cached.term,
          explanation: cachedExplanation,
          category: cached.category,
          relatedTerms: cached.relatedTerms,
        });
        return;
      }

      const res = await fetch(`${AI_SERVICE_URL}/explain-term`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: trimmed, level: forLevel }),
      });

      if (!res.ok) {
        throw new Error("Açıklama alınamadı.");
      }

      const data = await res.json();

      setResult({
        term: trimmed,
        explanation: data.explanation,
        category: data.category,
        relatedTerms: data.related_terms,
      });

      saveGlossaryTerm({
        term: trimmed,
        level: forLevel,
        explanation: data.explanation,
        category: data.category ?? undefined,
        relatedTerms: data.related_terms ?? [],
      })
        .then(() =>
          getGlossaryList()
            .then(setPopularTerms)
            .catch(() => {}),
        )
        .catch((err) => console.error("Terim kaydedilemedi:", err));
    } catch (err) {
      console.error(err);
      setError(
        "Terim açıklanamadı. AI servisinin çalıştığından emin olup tekrar deneyebilir misiniz?",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="mx-auto max-w-3xl px-5 py-12"
      style={{ color: "var(--text)" }}
    >
      <p
        className="text-sm font-medium"
        style={{ color: "var(--primary)" }}
      >
        ComparaAI
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Teknoloji Sözlüğü
      </h1>
      <p className="mt-3" style={{ color: "var(--text-secondary)" }}>
        Anlamadığınız bir teknoloji terimini yazın, seviyenize göre açıklayalım.
      </p>

      {/* Seviye seçimi */}
      <div className="mt-6 flex gap-2">
        {EXPERTISE_LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => handleLevelChange(l.value)}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={
              level === l.value
                ? { background: "var(--primary)", color: "#fff" }
                : {
                    background: "var(--surface)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Arama */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(input, level);
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Örn. RAM, OLED, 5G, SSD..."
          className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--surface)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          {loading ? "Aranıyor..." : "Açıkla"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="mt-6 rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{result.term}</h2>
            {result.category && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs"
                style={{
                  background: "var(--surface-soft)",
                  color: "var(--text-secondary)",
                }}
              >
                {result.category}
              </span>
            )}
          </div>

          <p
            className="mt-3 leading-7"
            style={{ color: "var(--text-secondary)" }}
          >
            {result.explanation}
          </p>

          {!!result.relatedTerms?.length && (
            <div className="mt-5 flex flex-wrap gap-2">
              {result.relatedTerms.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setInput(t);
                    lookup(t, level);
                  }}
                  className="rounded-full border px-3 py-1 text-xs transition-opacity hover:opacity-70"
                  style={{ borderColor: "var(--border)" }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {popularTerms.length > 0 && (
        <div className="mt-10">
          <p
            className="mb-3 text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Daha önce sorulan terimler
          </p>
          <div className="flex flex-wrap gap-2">
            {popularTerms.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setInput(t.term);
                  lookup(t.term, level);
                }}
                className="rounded-full border px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface)",
                }}
              >
                {t.term}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
