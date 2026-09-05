"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "ceo-command-center-theme";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    const preferredTheme =
      savedTheme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    setTheme(preferredTheme);
    document.documentElement.classList.toggle("dark", preferredTheme === "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [mounted, theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {isDark ? "☀" : "☾"}
      </span>
      <span>{mounted ? (isDark ? "Light" : "Dark") : "Theme"}</span>
    </button>
  );
}
