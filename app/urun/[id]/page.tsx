"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/api";

type AiScore = {
  overallScore: number;
  aiSummary?: string | null;
  bestFor?: string[];
  notFor?: string[];
  weaknesses?: string[];
};

type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string | null;
  price?: number | null;
  specs?: Record<string, unknown>;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  aiScore?: AiScore | null;
};

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProduct(id);
        setProduct(data);
      } catch (error) {
        console.error("Ürün alınamadı:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <main
        className="min-h-screen px-5 py-16"
        style={{
          background: "var(--background)",
          color: "var(--text)",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <p style={{ color: "var(--text-secondary)" }}>
            Ürün yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main
        className="min-h-screen px-5 py-16"
        style={{
          background: "var(--background)",
          color: "var(--text)",
        }}
      >
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            ← Ana sayfaya dön
          </Link>

          <div
            className="mt-8 rounded-2xl border p-8"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <h1 className="text-2xl font-semibold">
              Ürün bulunamadı
            </h1>

            <p
              className="mt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Aradığınız ürün mevcut değil veya kaldırılmış olabilir.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const specs = product.specs || {};

  return (
    <main
      className="min-h-screen px-5 py-12"
      style={{
        background: "var(--background)",
        color: "var(--text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/kategori/${product.category?.slug ?? ""}`}
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          ← {product.category?.name ?? "Kategoriye"} dön
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {/* Ürün görseli */}
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="aspect-[4/3] w-full"
              style={{
                background: "var(--surface-soft)",
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    ComparaAI
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ürün özeti */}
          <div
            className="rounded-2xl border p-7"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              {product.brand}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>

            <div
              className="my-7 h-px"
              style={{ background: "var(--border)" }}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(specs)
                .slice(0, 6)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border p-4"
                    style={{
                      background: "var(--surface-soft)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {key}
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {String(value)}
                    </p>
                  </div>
                ))}
            </div>

            <div className="mt-7">
              <Link
                href={`/karsilastir`}
                className="inline-flex rounded-lg px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                }}
              >
                Karşılaştır
              </Link>
            </div>
          </div>
        </div>

        {/* AI Ürün Skoru */}
        {product.aiScore && (
          <section className="mt-10">
            <div className="mb-5">
              <p
                className="text-sm font-medium"
                style={{ color: "var(--primary)" }}
              >
                Yapay zeka değerlendirmesi
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                AI Ürün Skoru
              </h2>
            </div>

            <div
              className="rounded-2xl border p-7"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-4 py-2 text-lg font-bold text-white"
                  style={{ background: "var(--primary)" }}
                >
                  {Math.round(product.aiScore.overallScore)}/100
                </span>
              </div>

              {product.aiScore.aiSummary && (
                <p
                  className="mt-4 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {product.aiScore.aiSummary}
                </p>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {!!product.aiScore.bestFor?.length && (
                  <div>
                    <p className="text-sm font-semibold">
                      Kime uygun
                    </p>

                    <ul
                      className="mt-2 list-disc space-y-1 pl-5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {product.aiScore.bestFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!!product.aiScore.notFor?.length && (
                  <div>
                    <p className="text-sm font-semibold">
                      Kime uygun değil
                    </p>

                    <ul
                      className="mt-2 list-disc space-y-1 pl-5 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {product.aiScore.notFor.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {!!product.aiScore.weaknesses?.length && (
                <div className="mt-6">
                  <p className="text-sm font-semibold">
                    Dikkat edilmesi gerekenler
                  </p>

                  <ul
                    className="mt-2 list-disc space-y-1 pl-5 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {product.aiScore.weaknesses.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p
                className="mt-6 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Bu değerlendirme yapay zeka tarafından ürün özelliklerine
                bakılarak üretilmiştir, kesin ölçüm sonucu değildir.
              </p>
            </div>
          </section>
        )}

        {/* Tüm teknik özellikler */}
        <section className="mt-10">
          <div className="mb-5">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              Teknik bilgiler
            </p>

            <h2 className="mt-1 text-2xl font-semibold">
              Özellikler
            </h2>
          </div>

          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            {Object.entries(specs).map(([key, value], index) => (
              <div
                key={key}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[220px_minmax(0,1fr)]"
                style={{
                  borderBottom:
                    index < Object.entries(specs).length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {key}
                </div>

                <div className="text-sm">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}