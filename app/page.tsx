import Link from "next/link";
import { getPublishedArticles, getImageUrl } from "@/lib/api";

const IMPORTANCE_LABELS: Record<string, { text: string; emoji: string }> = {
  dusuk: { text: "Düşük Önem", emoji: "🟢" },
  orta: { text: "Orta Önem", emoji: "🟡" },
  yuksek: { text: "Yüksek Önem", emoji: "🟠" },
  kritik: { text: "Kritik Önem", emoji: "🔴" },
};

export default async function HomePage() {
  const articles = await getPublishedArticles();
  const [featured, ...rest] = articles;
  const secondary = rest.slice(0, 6);

  return (
    <main>
      {/* ÜST ŞERİT: tagline + AI CTA */}
      <section
        className="border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className="text-sm font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--primary)" }}
            >
              Teknoloji Gündemi
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Teknoloji haberleri, tek yerde.
            </h1>
          </div>

          <Link
            href="/asistan"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Ürün önerisi için AI Asistan'a sor →
          </Link>
        </div>
      </section>

      {/* HABERLER */}
      <section className="mx-auto max-w-7xl px-5 py-12">
        {articles.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p style={{ color: "var(--text-secondary)" }}>
              Henüz yayınlanmış haber bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Öne çıkan haber */}
            <Link
              href={`/haberler/${featured.slug}`}
              className="group relative overflow-hidden rounded-2xl border transition-transform hover:-translate-y-0.5"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {featured.aiImportance &&
                IMPORTANCE_LABELS[featured.aiImportance] && (
                  <span
                    className="absolute z-10 m-4 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {IMPORTANCE_LABELS[featured.aiImportance].emoji}{" "}
                    {IMPORTANCE_LABELS[featured.aiImportance].text}
                  </span>
                )}

              <div
                className="aspect-[16/9]"
                style={{ background: "var(--surface-soft)" }}
              >
                {featured.imageUrl ? (
                  <img
                    src={getImageUrl(featured.imageUrl)}
                    alt={featured.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm">
                    <span style={{ color: "var(--text-secondary)" }}>
                      ComparaAI
                    </span>
                  </div>
                )}
              </div>

              <div className="p-7">
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {featured.author}
                </p>

                <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                  {featured.title}
                </h2>

                <p
                  className="mt-3 line-clamp-3 text-sm leading-7"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {featured.summary}
                </p>

                <span
                  className="mt-5 inline-block text-sm font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  Haberi oku →
                </span>
              </div>
            </Link>

            {/* Diğer haberler (kısa liste) */}
            <div className="flex flex-col gap-1">
              {secondary.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Şimdilik başka haber yok.
                </p>
              ) : (
                secondary.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/haberler/${article.slug}`}
                    className="flex items-start gap-4 rounded-xl px-3 py-4 transition-colors hover:opacity-80"
                    style={{
                      borderBottom:
                        i < secondary.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      className="h-16 w-20 shrink-0 overflow-hidden rounded-lg"
                      style={{ background: "var(--surface-soft)" }}
                    >
                      {article.imageUrl && (
                        <img
                          src={getImageUrl(article.imageUrl)}
                          alt={article.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {article.author}
                      </p>

                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {articles.length > 1 && (
          <div className="mt-8 text-right">
            <Link
              href="/haberler"
              className="text-sm font-medium"
              style={{ color: "var(--primary)" }}
            >
              Tüm haberler →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
