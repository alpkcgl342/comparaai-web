const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export type Product = {
  id: string;
  name: string;
  brand: string;
  price?: number | null;
  imageUrl?: string | null;
  specs?: Record<string, unknown>;
  category?: Category | null;
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