"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("pc.theme", next);
    } catch {
      /* ignore */
    }
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors duration-[var(--dur-fast)] ease-out hover:border-ink-3 hover:text-ink"
    >
      {/* render after mount to avoid SSR/client mismatch on the icon */}
      <span className="sr-only">Toggle theme</span>
      {mounted && (isDark ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />)}
    </button>
  );
}
