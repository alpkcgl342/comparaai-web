"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur"
      style={{
        backgroundColor: "color-mix(in srgb, var(--surface) 92%, transparent)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link
          href="/"
          className="flex items-center gap-3"
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: "var(--primary)",
              color: "#fff",
            }}
          >
            C
          </div>

          <span className="text-lg font-semibold tracking-tight">
            Compara<span style={{ color: "var(--primary)" }}>AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          <Link
            href="/haberler"
            className="transition-opacity hover:opacity-70"
          >
            Haberler
          </Link>

          <Link
            href="/sozluk"
            className="transition-opacity hover:opacity-70"
          >
            Sözlük
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/asistan"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            AI Asistan
          </Link>
        </div>
      </div>
    </header>
  );
}