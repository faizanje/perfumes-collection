"use client";

// Which bottle photo the grid shows by default, app-wide: the inspired-by
// "original" (the designer fragrance) or the real "house" bottle the owner owns
// (e.g. the Arome decant). Per-card hover/tap still flips an individual card;
// this is only the default. Persists to localStorage like the theme + favorites.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type BottleMode = "original" | "house";

interface BottlePrefState {
  mode: BottleMode;
  setMode: (m: BottleMode) => void;
  ready: boolean;
}

const KEY = "pc.bottlePref.v1";
const Ctx = createContext<BottlePrefState | null>(null);

export function BottlePrefProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<BottleMode>("original");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === "house" || raw === "original") setModeState(raw);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  const setMode = useCallback((m: BottleMode) => {
    setModeState(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const value = useMemo<BottlePrefState>(() => ({ mode, setMode, ready }), [mode, setMode, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBottlePref(): BottlePrefState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBottlePref must be used within BottlePrefProvider");
  return ctx;
}
