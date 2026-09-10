import { notFound } from "next/navigation";
import { getArticleBySlug, getImageUrl } from "@/lib/api";

const IMPORTANCE_LABELS = {
  kritik: {
    emoji: "🔴",
    text: "Kritik önem",
  },
  high: {
    emoji: "🟠",
    text: "Yüksek önem",
  },
  medium: {
    emoji: "🟡",
    text: "Orta önem",
  },
  low: {
    emoji: "🟢",
    text: "Düşük önem",
  },
} as const;

type ImportanceKey = keyof typeof IMPORTANCE_LABELS;

function isImportanceKey(value: unknown): value is ImportanceKey {
  return typeof value === "string" && value in IMPORTANCE_LABELS;
}

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function HaberDetayPage({
  params,
}: Props) {
  const { slug } = await params;

  const article = await getArticleBySlug(slug);

  if (!article || !article.isPublished) {
    notFound();
  }

  const importance = isImportanceKey(article.aiImportance)
    ? IMPORTANCE_LABELS[article.aiImportance]
    : null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-14">
      <article>
        <p
          className="text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          {article.author}
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          {article.title}
        </h1>

        {importance && (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <span>{importance.emoji}</span>
            <span>{importance.text}</span>
          </div>
        )}

        <p
          className="mt-5 text-lg leading-8"
          style={{ color: "var(--text-secondary)" }}
        >
          {article.summary}
        </p>

        <div
          className="mt-8 overflow-hidden rounded-2xl"
          style={{ background: "var(--surface-soft)" }}
        >
          {article.imageUrl ? (
            <img
              src={getImageUrl(article.imageUrl)}
              alt={article.title}
              className="max-h-[560px] w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[280px] items-center justify-center">
              <span style={{ color: "var(--text-secondary)" }}>
                ComparaAI
              </span>
            </div>
          )}
        </div>

        <div
          className="mt-10 whitespace-pre-wrap text-base leading-8"
          style={{ color: "var(--text)" }}
        >
          {article.content}
        </div>

        {(article.aiWhyItMatters || article.aiWhoItAffects) && (
          <div
            className="mt-10 rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: "var(--primary)" }}
            >
              AI Değerlendirmesi
            </p>

            {article.aiWhyItMatters && (
              <p
                className="mt-3 text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Neden önemli:
                </span>{" "}
                {article.aiWhyItMatters}
              </p>
            )}

            {article.aiWhoItAffects && (
              <p
                className="mt-3 text-sm leading-6"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  Kimi etkiler:
                </span>{" "}
                {article.aiWhoItAffects}
              </p>
            )}
          </div>
        )}
      </article>
    </main>
  );
}
