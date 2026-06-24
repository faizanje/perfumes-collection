"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Group } from "@/lib/group";
import type { Perfume } from "@/lib/types";
import { houseLogo, houseLogoIsWordmark } from "@/lib/houseLogos";
import { PerfumeCard } from "./PerfumeCard";

export function GroupSection({
  group,
  onOpen,
  defaultOpen = true,
  resetSignal = 0,
}: {
  group: Group;
  onOpen: (p: Perfume) => void;
  defaultOpen?: boolean;
  resetSignal?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // when "collapse/expand all" is clicked, snap every section to the new default
  useEffect(() => {
    setOpen(defaultOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // a wordmark logo already spells the house name, so when both theme variants
  // exist we drop the redundant text label and show the logo alone; a monogram
  // mark keeps its text label beside it
  const logo = houseLogo(group.house);
  const hasFullLogo = Boolean(logo?.dark && logo?.light);
  const wordmark = hasFullLogo && houseLogoIsWordmark(group.house);

  return (
    <section data-family={group.family} className="scroll-mt-24">
      <header className="sticky top-[6.75rem] z-20 -mx-2 mb-4 px-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="group/header flex w-full items-center gap-3 rounded-lg border border-line px-3.5 py-2.5 text-left backdrop-blur-md transition-colors hover:border-ink-3"
          style={{
            background: group.family
              ? "linear-gradient(90deg, color-mix(in oklab, var(--fam) 24%, var(--color-surface)), color-mix(in oklab, var(--fam) 8%, var(--color-surface)))"
              : "color-mix(in oklab, var(--color-surface) 86%, transparent)",
          }}
        >
          {hasFullLogo ? (
            <>
              {/* wordmark logo replaces the text label; a monogram mark sits beside it */}
              <span className={`flex h-7 shrink-0 items-center ${wordmark ? "min-w-0 flex-1" : ""}`}>
                <img src={logo!.dark} alt={group.label} className="hidden h-7 w-auto max-w-[160px] object-contain dark:block" />
                <img src={logo!.light} alt={group.label} className="block h-7 w-auto max-w-[160px] object-contain dark:hidden" />
              </span>
              {!wordmark && <h2 className="min-w-0 flex-1 truncate text-lg leading-tight text-ink">{group.label}</h2>}
            </>
          ) : (
            <>
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: group.family ? "var(--fam)" : "var(--color-accent)" }}
              />
              <h2 className="min-w-0 flex-1 truncate text-lg leading-tight text-ink">{group.label}</h2>
            </>
          )}
          <span className="hidden shrink-0 text-xs text-ink-3 sm:inline">
            <span className="tnum text-ink-2">{group.items.length}</span> fragrances
          </span>
          <span className="tnum shrink-0 rounded-full bg-[color-mix(in_oklab,var(--color-ink)_10%,transparent)] px-2 py-0.5 text-xs text-ink-2 sm:hidden">
            {group.items.length}
          </span>
          <span className="hidden shrink-0 text-xs text-ink-3 opacity-0 transition-opacity group-hover/header:opacity-100 md:inline">
            {open ? "Collapse" : "Expand"}
          </span>
          <ChevronDown
            size={17}
            strokeWidth={2}
            className={`shrink-0 text-ink-3 transition-transform duration-[var(--dur-fast)] ease-out ${open ? "" : "-rotate-90"}`}
            aria-hidden
          />
        </button>
      </header>

      {open && (
        <div className="mb-10 grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-3.5">
          {group.items.map((p) => (
            <PerfumeCard key={p.id} perfume={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
