"use client";

import { Heart } from "lucide-react";
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
  const dim = size === "sm" ? 15 : 18;

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
        label ? "border border-line px-3 py-1.5 hover:border-ink-3" : ""
      }`}
    >
      <Heart
        size={dim}
        strokeWidth={1.8}
        className="transition-colors"
        style={{
          color: fav ? "var(--color-accent)" : label ? "var(--color-ink-2)" : "#ffffff",
          fill: fav ? "var(--color-accent)" : "transparent",
        }}
      />
      {label && <span className="text-sm text-ink-2">{fav ? "Saved" : "Save"}</span>}
    </button>
  );
}
