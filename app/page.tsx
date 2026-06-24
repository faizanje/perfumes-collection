import Link from "next/link";
import { getCollection, getFacets } from "@/lib/data";
import { familyMeta } from "@/lib/families";
import { GalleryClient } from "@/components/GalleryClient";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  const collection = getCollection();
  const facets = getFacets();
  const houseCount = facets.houses.length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-shell px-4 sm:px-6">
        {/* masthead */}
        <section className="grid grid-cols-1 gap-8 py-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:py-16">
          <div>
            <p className="label mb-4">A personal fragrance collection</p>
            <h1 className="text-display leading-[0.95] text-ink">
              Shelf
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              Every bottle in the collection: its notes, its family, the seasons and
              occasions it suits, and what it layers with. Search, filter, and decide
              what to wear.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/wear"
                className="rounded-full bg-ink px-5 py-2.5 text-sm text-canvas transition-transform duration-[var(--dur-fast)] ease-out hover:-translate-y-0.5"
              >
                What should I wear today? →
              </Link>
              <span className="text-sm text-ink-3">or browse all {facets.total} below</span>
            </div>
          </div>

          <dl className="flex gap-8 md:flex-col md:gap-4 md:border-l md:border-line md:pl-8">
            <Stat n={facets.total} label="fragrances" />
            <Stat n={houseCount} label="houses" />
            <Stat n={facets.families.length} label="families" />
          </dl>
        </section>

        {/* family legend */}
        <section className="mb-10 border-y border-line py-5">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {facets.families.map(([fam, n]) => (
              <span key={fam} data-family={fam} className="inline-flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--fam)" }} />
                <span className="text-ink-2">{familyMeta(fam).short}</span>
                <span className="tnum text-xs text-ink-3">{n}</span>
              </span>
            ))}
          </div>
        </section>

        <GalleryClient collection={collection} facets={facets} />
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <dd className="font-display text-3xl leading-none text-ink tnum">{n}</dd>
      <dt className="label mt-1.5">{label}</dt>
    </div>
  );
}
