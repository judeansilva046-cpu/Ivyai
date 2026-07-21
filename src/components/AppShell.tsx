"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/", label: "Painel", icon: "grid" },
  { href: "/insumos", label: "Insumos", icon: "box" },
  { href: "/fichas", label: "Ficha Técnica", icon: "book" },
  { href: "/precificacao", label: "Precificação", icon: "tag" },
  { href: "/etiquetas", label: "Etiquetas", icon: "label" },
] as const;

function NavIcon({ name }: { name: (typeof nav)[number]["icon"] }) {
  const common = "h-4 w-4";
  switch (name) {
    case "grid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "box":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      );
    case "book":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "tag":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case "label":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h10M7 13h6" />
        </svg>
      );
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-40 border-b border-dh-line/80 bg-[#f7faf7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-dh-ink text-sm font-bold tracking-tight text-white transition-transform group-hover:scale-105">
              DH
            </span>
            <div className="leading-tight">
              <p className="font-display text-lg font-semibold tracking-tight text-dh-ink">
                DeliveryHub
              </p>
              <p className="hidden text-[11px] text-dh-muted lg:block">
                Operação de cozinha e delivery
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-dh-sage-soft text-dh-sage"
                    : "text-dh-ink-soft hover:bg-white hover:text-dh-ink"
                }`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="btn btn-secondary lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </div>

        {open && (
          <nav className="dh-fade border-t border-dh-line px-4 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-dh-sage-soft text-dh-sage"
                      : "text-dh-ink-soft"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <footer className="no-print border-t border-dh-line/70 py-6 text-center text-xs text-dh-muted">
        DeliveryHub — insumos, fichas técnicas, precificação e etiquetas de validade
      </footer>
    </div>
  );
}
