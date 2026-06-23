"use client";

import { useUserMeta } from "@/lib/userMeta";

export function FavoriteButton({
  id,
  size = "md",
  label = false,
}: {
  id: string;
  size?: "sm" | "md";
  label?: boolean;
}) {
  const { isFavorite, toggleFavorite, ready } = useUserMeta();
  const fav = ready && isFavorite(id);
  const dim = size === "sm" ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorite(id);
      }}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favourites" : "Add to favourites"}
      className={`group inline-flex items-center gap-1.5 rounded-full transition-transform duration-[var(--dur-fast)] ease-out active:scale-90 ${
        label ? "px-3 py-1.5 border border-line hover:border-ink-3" : ""
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={dim}
        fill={fav ? "var(--color-accent)" : "none"}
        stroke={fav ? "var(--color-accent)" : "var(--color-ink-3)"}
        strokeWidth="1.6"
        aria-hidden
      >
        <path d="M12 21s-7.5-4.6-10-9.2C.4 8.5 1.8 5 5 5c2 0 3.2 1.2 4 2.4C9.8 6.2 11 5 13 5c3.2 0 4.6 3.5 3 6.8C19.5 16.4 12 21 12 21z" />
      </svg>
      {label && <span className="text-sm">{fav ? "Saved" : "Save"}</span>}
    </button>
  );
}
