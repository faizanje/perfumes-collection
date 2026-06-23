"use client";

import { useState } from "react";
import type { Group } from "@/lib/group";
import type { Perfume } from "@/lib/types";
import { PerfumeCard } from "./PerfumeCard";

export function GroupSection({
  group,
  onOpen,
}: {
  group: Group;
  onOpen: (p: Perfume) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section data-family={group.family} className="scroll-mt-24">
      <header className="sticky top-[3.65rem] z-20 -mx-2 mb-4 px-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-md border border-line px-3.5 py-2.5 text-left backdrop-blur-md transition-colors hover:border-line-2"
          style={{
            background: group.family
              ? "linear-gradient(90deg, color-mix(in oklab, var(--fam) 24%, var(--color-surface)), color-mix(in oklab, var(--fam) 8%, var(--color-surface)))"
              : "color-mix(in oklab, var(--color-surface) 86%, transparent)",
          }}
        >
          <span
            aria-hidden
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ background: group.family ? "var(--fam)" : "var(--color-accent)" }}
          />
          <h2 className="min-w-0 flex-1 truncate text-lg leading-tight text-ink">{group.label}</h2>
          <span className="tnum rounded-full bg-[color-mix(in_oklab,var(--color-ink)_10%,transparent)] px-2 py-0.5 text-xs text-ink-2">
            {group.items.length}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 shrink-0 text-ink-3 transition-transform duration-[var(--dur-fast)] ease-out ${open ? "" : "-rotate-90"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {open && (
        <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3.5">
          {group.items.map((p) => (
            <PerfumeCard key={p.id} perfume={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
