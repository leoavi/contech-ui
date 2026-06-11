"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import { THEME_STORAGE_KEY as DEFAULT_KEY } from "../lib/theme";

type Theme = "dark" | "light";

/**
 * Alterna dark ↔ light. O tema vive no atributo `data-theme` do <html>
 * (a paleta light está em contech.css). Default = dark; só "light" persiste e
 * seta o atributo. Para evitar flash no carregamento, o app deve rodar o script
 * anti-flash de `themeInitScript` no <head> antes do primeiro paint.
 *
 * `variant="icon"` (default) = botão quadrado só com ícone (topbar).
 * `variant="full"` = botão largo com ícone + rótulo (sidebar).
 */
export function ThemeToggle({
  storageKey = DEFAULT_KEY,
  variant = "icon",
  className,
}: {
  storageKey?: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* localStorage indisponível — sem persistência, tudo bem */
    }
  }

  const isDark = theme === "dark";
  const icon = isDark ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
  const rotulo = isDark ? "Tema claro" : "Tema escuro";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={rotulo}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-chumbo-100 px-3 py-2 text-xs font-semibold text-chumbo-500 transition-colors hover:border-bordo-700/40 hover:text-bordo-700",
          className,
        )}
      >
        {icon}
        {rotulo}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border border-chumbo-100 text-chumbo-500 transition-colors hover:border-bordo-700/40 hover:text-bordo-700",
        className,
      )}
    >
      {icon}
    </button>
  );
}
