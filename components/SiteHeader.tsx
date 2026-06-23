import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-shell items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group inline-flex items-baseline gap-2">
          <span className="font-display text-xl text-ink">The Vault</span>
          <span className="label hidden sm:inline">est. collection</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <NavLink href="/">Collection</NavLink>
          <NavLink href="/wear">What to wear</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
    >
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-lg text-ink">The Vault</p>
            <p className="mt-1 max-w-md text-sm text-ink-3">
              A personal fragrance archive. Data enriched from public fragrance notes; some
              entries marked “unverified” are auto-derived and worth a personal check.
            </p>
          </div>
          <p className="label">View-only share · built with care</p>
        </div>
      </div>
    </footer>
  );
}
