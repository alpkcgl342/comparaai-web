const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";

export function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  return `${API_URL}${imageUrl}`;
}

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductAiScore = {
  overallScore: number;
  performanceScore?: number | null;
  cameraScore?: number | null;
  batteryScore?: number | null;
  softwareScore?: number | null;
  valueScore?: number | null;
  futureProofScore?: number | null;
  aiSummary?: string | null;
  bestFor?: string[];
  notFor?: string[];
  weaknesses?: string[];
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  price?: number | null;
  segment?: string;
  imageUrl?: string | null;
  specs?: Record<string, unknown>;
  category?: Category | null;
  aiScore?: ProductAiScore | null;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  imageUrl?: string | null;
  author: string;
  isPublished: boolean;
  aiImportance?: string | null;
  aiWhyItMatters?: string | null;
  aiWhoItAffects?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductFilters = {
  categoryId?: string;
  brand?: string;
  segment?: string;
  minPrice?: string;
  maxPrice?: string;
  minRam?: string;
  minStorage?: string;
  minBattery?: string;
};

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getCategories() {
  return apiFetch<Category[]>("/categories");
}

export function getProducts(filters?: ProductFilters) {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }

  const query = params.toString();

  return apiFetch<Product[]>(
    query ? `/products?${query}` : "/products",
  );
}

export function getProduct(id: string) {
  return apiFetch<Product>(
    `/products/${encodeURIComponent(id)}`,
  );
}

export function getPublishedArticles() {
  return apiFetch<Article[]>("/articles/published");
}

export function getArticleBySlug(slug: string) {
  return apiFetch<Article>(
    `/articles/slug/${encodeURIComponent(slug)}`,
  );
}

// Faz 3 — AI Asistan'ın ürettiği karşılaştırma/öneri sonucunu loglar
// (AiComparison tablosu, JWT gerektirmez — misafir kullanım).
export async function saveComparison(data: {
  productIds: string[];
  scenario?: string;
  result: unknown;
}) {
  const res = await fetch(`${API_URL}/comparisons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Karşılaştırma kaydedilemedi.");
  }

  return res.json();
}

// Faz 4 — Teknoloji Terimleri Sözlüğü (cache-then-serve).
export type GlossaryTerm = {
  id: string;
  term: string;
  explanationSimple?: string | null;
  explanationNormal?: string | null;
  explanationTechnical?: string | null;
  explanationExpert?: string | null;
  category?: string | null;
  relatedTerms?: string[];
};

export async function getGlossaryTerm(
  term: string,
): Promise<GlossaryTerm | null> {
  const res = await fetch(
    `${API_URL}/glossary/${encodeURIComponent(term)}`,
    { cache: "no-store" },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Sözlük sorgusu başarısız.");

  const data = await res.json();
  return data ?? null;
}

export async function getGlossaryList(): Promise<
  { id: string; term: string; category?: string | null }[]
> {
  const res = await fetch(`${API_URL}/glossary`, { cache: "no-store" });
  if (!res.ok) throw new Error("Sözlük listesi alınamadı.");
  return res.json();
}

export async function saveGlossaryTerm(data: {
  term: string;
  level: string;
  explanation: string;
  category?: string;
  relatedTerms?: string[];
}) {
  const res = await fetch(`${API_URL}/glossary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Sözlük terimi kaydedilemedi.");
  return res.json();
}