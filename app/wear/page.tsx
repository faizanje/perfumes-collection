import type { Metadata } from "next";
import { getCollection, getFacets } from "@/lib/data";
import { WearClient } from "@/components/WearClient";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "What should I wear? · The Vault",
  description: "Pick a season, occasion and time to get matching fragrances from the collection.",
};

export default function WearPage() {
  const collection = getCollection();
  const facets = getFacets();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-shell px-4 sm:px-6">
        <section className="py-12 md:py-14">
          <p className="label mb-4">The right scent for the moment</p>
          <h1 className="text-3xl leading-tight text-ink sm:text-[2.75rem]">
            What should I wear today?
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            Tell me the weather and the moment. I&apos;ll rank the collection by what fits,
            strongest first.
          </p>
        </section>
        <WearClient collection={collection} facets={facets} />
      </main>
      <SiteFooter />
    </>
  );
}
