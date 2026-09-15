"use client";

import { useEffect, useRef, useState } from "react";
import {
  AI_SERVICE_URL,
  getCategories,
  getProducts,
  saveComparison,
  type Category,
  type Product,
} from "@/lib/api";
import {
  EXPERTISE_LEVELS,
  getStoredExpertiseLevel,
  setStoredExpertiseLevel,
  type ExpertiseLevel,
} from "@/lib/expertiseLevel";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Bu değerler comparaai-ai/app/ai/prompts/parse.py'deki CATEGORY_TEMPLATES
// ile birebir eşleşmeli — /parse endpoint'i yalnızca bu kategori tiplerini
// destekliyor. Admin panelde bunların dışında bir kategori (farklı slug)
// oluşturulursa AI ürün önerisi yapamaz, genel sohbete düşer.
const SUPPORTED_CATEGORY_SLUGS = [
  "telefon",
  "laptop",
  "masaustu",
  "pc-parcalari",
];

type ParsedIntent = {
  segment: string | null;
  priority: string | null;
  usage: string | null;
  brand: string | null;
  price_insistence: boolean;
  needs_clarification: boolean;
  clarification_question: string | null;
};

// comparaai-ai'nin Product modeline eşlenir — varsa ProductAiScore'u da
// (özellikle future_proof_score) ekler, AI bunu geleceğe dönüklük gibi
// sorularda kullanabilsin.
function toAiProduct(p: Product) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    specs: p.specs ?? {},
    ai_score: p.aiScore
      ? {
          overall_score: p.aiScore.overallScore,
          future_proof_score: p.aiScore.futureProofScore ?? null,
          value_score: p.aiScore.valueScore ?? null,
          ai_summary: p.aiScore.aiSummary ?? null,
        }
      : null,
  };
}

async function callAi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`AI servisi hatası (${path}): ${res.status}`);
  }

  return res.json();
}

const WELCOME_MESSAGE = `Merhaba, ben ComparaAI'nin teknoloji danışmanıyım. 👋

Telefon, laptop, masaüstü bilgisayar ve PC parçaları arasında karşılaştırma yapıp elimizdeki ürün verilerine dayanarak size en uygun seçeneği önerebilirim — uydurma bilgi vermem, sadece gerçekten sahip olduğumuz özelliklere göre değerlendiririm.

Bana şunları söylerseniz daha isabetli bir öneri sunabilirim:
• Bütçeniz (kesin rakam vermeseniz de "ekonomik / orta / üst segment" gibi bir fikir yeterli)
• Ne için kullanacağınız (günlük kullanım, oyun, tasarım/video, iş vb.)
• Sizin için en önemli özellik (kamera, batarya, performans, taşınabilirlik...)

Örnek: "Öğrenci bütçesine uygun, pil ömrü uzun bir laptop arıyorum, oyun oynamayacağım."

Ne aramak istersiniz?`;

export default function AsistanPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: WELCOME_MESSAGE,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<ExpertiseLevel>("normal");

  // Konuşma bağlamı: bir kategori üzerinde netleşince, sonraki mesajlar
  // o ürünler hakkında takip sorusu (followup) olarak değerlendirilir.
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  // Kategori bulundu ama bütçe/öncelik netleşmedi (needs_clarification) —
  // bir sonraki mesajı tekrar /parse ile bu kategori üzerinden değerlendir.
  const [pendingCategory, setPendingCategory] = useState<Category | null>(
    null,
  );
  const [pendingCandidates, setPendingCandidates] = useState<Product[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Kategoriler alınamadı:", err));
    setLevel(getStoredExpertiseLevel());
  }, []);

  function handleLevelChange(newLevel: ExpertiseLevel) {
    setLevel(newLevel);
    setStoredExpertiseLevel(newLevel);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resetConversation() {
    setActiveCategory(null);
    setActiveProducts([]);
    setPendingCategory(null);
    setPendingCandidates([]);
    setMessages([
      {
        role: "assistant",
        content: WELCOME_MESSAGE,
      },
    ]);
  }

  async function recommendFromCategory(
    category: Category,
    parsed: ParsedIntent,
    candidates: Product[],
    originalMessage: string,
  ) {
    let filtered = candidates;

    if (parsed.segment) {
      const bySegment = filtered.filter(
        (p) => p.segment === parsed.segment,
      );
      if (bySegment.length > 0) filtered = bySegment;
    }

    if (parsed.brand) {
      const byBrand = filtered.filter(
        (p) => p.brand.toLowerCase() === parsed.brand!.toLowerCase(),
      );
      if (byBrand.length > 0) filtered = byBrand;
    }

    if (filtered.length === 0) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `${category.name} kategorisinde henüz kayıtlı ürün yok, bu yüzden şu an bir öneri sunamıyorum.`,
        },
      ]);
      return;
    }

    const shortlist = filtered.slice(0, 8);

    const result = await callAi<{ recommendation: string }>("/recommend", {
      products: shortlist.map(toAiProduct),
      priority: parsed.priority ?? undefined,
      context: originalMessage,
      expertise_level: level,
    });

    setActiveCategory(category);
    setActiveProducts(shortlist);
    setPendingCategory(null);
    setPendingCandidates([]);

    saveComparison({
      productIds: shortlist.map((p) => p.id),
      scenario: originalMessage,
      result: { type: "recommend", recommendation: result.recommendation },
    }).catch((err) => console.error("Karşılaştırma loglanamadı:", err));

    setMessages((m) => [
      ...m,
      { role: "assistant", content: result.recommendation },
    ]);
  }

  async function handleSend() {
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);

    try {
      // 1) Devam eden bir ürün konuşması varsa (öneri VEYA isimli
      // karşılaştırmadan gelmiş olabilir — activeCategory olmasa da olur):
      // takip sorusu.
      if (activeProducts.length > 0) {
        const result = await callAi<{ answer: string }>("/followup", {
          products: activeProducts.map(toAiProduct),
          question: message,
          expertise_level: level,
        });

        setMessages((m) => [
          ...m,
          { role: "assistant", content: result.answer },
        ]);
        return;
      }

      // 1b) Taze bir konuşmanın ilk mesajında, kullanıcı doğrudan 2+
      // spesifik ürün adı verdiyse ("X mi Y mi almalıyım", "A55'ten A56'ya
      // geçmeye değer mi") bunu genel kategori akışı yerine doğrudan bir
      // karşılaştırma olarak ele al. NOT: Bu, her yeni mesajda bir AI çağrısı
      // (extract-entities) daha demek — ürün kataloğu büyüdükçe maliyeti
      // gözden geçirin.
      if (!pendingCategory) {
        const allProducts = await getProducts();
        if (allProducts.length >= 2) {
          const ner = await callAi<{
            entities: {
              entity_type: string;
              entity_name: string;
              product_id: string | null;
            }[];
          }>("/extract-entities", {
            title: "",
            content: message,
            known_products: allProducts.map((p) => ({
              id: p.id,
              name: p.name,
              brand: p.brand,
            })),
          });

          const matchedIds = Array.from(
            new Set(
              ner.entities
                .filter((e) => e.entity_type === "product" && e.product_id)
                .map((e) => e.product_id as string),
            ),
          );

          if (matchedIds.length >= 2) {
            const compareProducts = allProducts.filter((p) =>
              matchedIds.includes(p.id),
            );

            const result = await callAi<{ comparison: string }>("/compare", {
              products: compareProducts.map(toAiProduct),
              context: message,
              expertise_level: level,
            });

            setActiveCategory(compareProducts[0].category ?? null);
            setActiveProducts(compareProducts);

            saveComparison({
              productIds: compareProducts.map((p) => p.id),
              scenario: message,
              result: { type: "compare", comparison: result.comparison },
            }).catch((err) =>
              console.error("Karşılaştırma loglanamadı:", err),
            );

            setMessages((m) => [
              ...m,
              { role: "assistant", content: result.comparison },
            ]);
            return;
          }
        }
      }

      // 2) Netleştirme bekleniyorsa: aynı kategori üzerinden tekrar parse et.
      if (pendingCategory) {
        const parsed = await callAi<ParsedIntent>("/parse", {
          category_type: pendingCategory.slug,
          message,
          known_brands: Array.from(
            new Set(pendingCandidates.map((p) => p.brand)),
          ),
        });

        if (parsed.needs_clarification) {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content:
                parsed.clarification_question ??
                "Bütçeniz ve önceliğiniz hakkında biraz daha bilgi verebilir misiniz?",
            },
          ]);
          return;
        }

        await recommendFromCategory(
          pendingCategory,
          parsed,
          pendingCandidates,
          message,
        );
        return;
      }

      // 3) Yeni konuşma: önce kategori tespiti.
      const categoriesStr = categories
        .map((c) => `${c.slug}:${c.name}`)
        .join(", ");

      const { category_slug } = await callAi<{
        category_slug: string | null;
      }>("/detect-category", { message, categories: categoriesStr });

      const category = categories.find((c) => c.slug === category_slug);

      if (
        !category ||
        !SUPPORTED_CATEGORY_SLUGS.includes(category.slug)
      ) {
        // Kategori bulunamadı / desteklenmiyor → genel sohbet.
        const result = await callAi<{ answer: string }>("/general-chat", {
          message,
          expertise_level: level,
        });
        setMessages((m) => [
          ...m,
          { role: "assistant", content: result.answer },
        ]);
        return;
      }

      const candidates = await getProducts({ categoryId: category.id });
      const knownBrands = Array.from(
        new Set(candidates.map((p) => p.brand)),
      );

      const parsed = await callAi<ParsedIntent>("/parse", {
        category_type: category.slug,
        message,
        known_brands: knownBrands,
      });

      if (parsed.needs_clarification) {
        setPendingCategory(category);
        setPendingCandidates(candidates);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              parsed.clarification_question ??
              "Bütçeniz ve önceliğiniz hakkında biraz daha bilgi verebilir misiniz?",
          },
        ]);
        return;
      }

      await recommendFromCategory(category, parsed, candidates, message);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Şu anda cevap veremedim. AI servisinin çalıştığından emin olup tekrar deneyebilir misiniz?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col px-5 py-8"
      style={{ color: "var(--text)" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            ComparaAI
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Asistan
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={level}
            onChange={(e) =>
              handleLevelChange(e.target.value as ExpertiseLevel)
            }
            className="rounded-lg border px-2 py-2 text-xs font-medium outline-none"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
            title="Teknik seviyeniz — cevapların ayrıntı düzeyini belirler"
          >
            {EXPERTISE_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetConversation}
            className="rounded-lg border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--border)" }}
          >
            Yeni sohbet
          </button>
        </div>
      </div>

      <div
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border p-5"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className="flex"
            style={{
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6"
              style={
                msg.role === "user"
                  ? { background: "var(--primary)", color: "#fff" }
                  : {
                      background: "var(--surface-soft)",
                      color: "var(--text)",
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "var(--surface-soft)",
                color: "var(--text-secondary)",
              }}
            >
              Yazıyor...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Örn. Öğrenci bütçesine uygun oyun laptopu arıyorum"
          className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none"
          style={{
            background: "var(--background)",
            color: "var(--text)",
            borderColor: "var(--border)",
          }}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: "var(--primary)" }}
        >
          Gönder
        </button>
      </form>
    </main>
  );
}
