"use client";

// Owner-editable metadata: favorites + personal notes + ratings.
// v1 persists to localStorage (per-device, owner-only). The provider is the
// seam: v2 swaps the read/write bodies for Supabase calls keyed by the signed-in
// user, and the brother's viewer role simply gets read-only access.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface PerfumeMeta {
  note?: string;
  rating?: number; // 1..5
}

interface UserMetaState {
  favorites: Set<string>;
  meta: Record<string, PerfumeMeta>;
  ready: boolean;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  setNote: (id: string, note: string) => void;
  setRating: (id: string, rating: number) => void;
  favoriteCount: number;
}

const KEY = "pc.userMeta.v1";
const Ctx = createContext<UserMetaState | null>(null);

interface Persisted {
  favorites: string[];
  meta: Record<string, PerfumeMeta>;
}

export function UserMetaProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<Record<string, PerfumeMeta>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        setFavorites(new Set(parsed.favorites ?? []));
        setMeta(parsed.meta ?? {});
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  const persist = useCallback((favs: Set<string>, m: Record<string, PerfumeMeta>) => {
    try {
      const payload: Persisted = { favorites: [...favs], meta: m };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setMeta((m) => {
          persist(next, m);
          return m;
        });
        return next;
      });
    },
    [persist]
  );

  const setNote = useCallback(
    (id: string, note: string) => {
      setMeta((prev) => {
        const next = { ...prev, [id]: { ...prev[id], note } };
        persist(favorites, next);
        return next;
      });
    },
    [favorites, persist]
  );

  const setRating = useCallback(
    (id: string, rating: number) => {
      setMeta((prev) => {
        const next = { ...prev, [id]: { ...prev[id], rating } };
        persist(favorites, next);
        return next;
      });
    },
    [favorites, persist]
  );

  const value = useMemo<UserMetaState>(
    () => ({
      favorites,
      meta,
      ready,
      toggleFavorite,
      isFavorite: (id) => favorites.has(id),
      setNote,
      setRating,
      favoriteCount: favorites.size,
    }),
    [favorites, meta, ready, toggleFavorite, setNote, setRating]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserMeta(): UserMetaState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserMeta must be used within UserMetaProvider");
  return ctx;
}
