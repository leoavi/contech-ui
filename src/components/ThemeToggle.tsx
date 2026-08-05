"use client";

import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import {
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY as DEFAULT_KEY,
  type Theme,
  parseTheme,
  readThemeCookie,
} from "../lib/theme";

/** Evento na mesma aba (storage event só dispara entre abas). */
const THEME_EVENT = "contech-theme-change";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 ano

function readStoredTheme(storageKey: string): Theme {
  try {
    const ls = localStorage.getItem(storageKey);
    if (ls === "light" || ls === "dark") return ls;
  } catch {
    /* private mode */
  }
  const fromCookie = readThemeCookie(
    typeof document !== "undefined" ? document.cookie : null,
  );
  if (fromCookie) return fromCookie;
  // Fallback: atributo já aplicado pelo themeInitScript / SSR
  if (typeof document !== "undefined") {
    return document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  }
  return "dark";
}

function writeThemeCookie(theme: Theme, cookieName: string = THEME_COOKIE_NAME) {
  try {
    // Secure só em https — em LAN http://192.168.x o cookie precisa ir sem Secure.
    const secure =
      typeof location !== "undefined" && location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${cookieName}=${encodeURIComponent(theme)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
  } catch {
    /* cookie bloqueado */
  }
}

/** Aplica tema no DOM + localStorage + cookie e notifica outros toggles da aba. */
export function applyTheme(theme: Theme, storageKey: string = DEFAULT_KEY) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    /* localStorage indisponível — cookie ainda salva */
  }
  writeThemeCookie(theme);
  try {
    window.dispatchEvent(
      new CustomEvent(THEME_EVENT, { detail: { theme, storageKey } }),
    );
  } catch {
    /* SSR / ambiente sem window */
  }
}

/**
 * Alterna dark ↔ light. O tema vive no atributo `data-theme` do <html>
 * (a paleta light está em contech.css). Default = dark; "light" seta o atributo.
 *
 * Persistência em DUAS camadas (localStorage + cookie `contech-theme`) pra
 * sobreviver a reabertura de UI / webview onde só uma das duas fica. Anti-flash:
 * `themeInitScript` no <head> + `data-theme` SSR a partir do cookie no layout.
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
  // dark no SSR; hidrata do storage no effect (evita mismatch).
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readStoredTheme(storageKey));

    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || e.newValue == null) return;
      setTheme(parseTheme(e.newValue));
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ theme?: string; storageKey?: string }>)
        .detail;
      if (detail?.storageKey && detail.storageKey !== storageKey) return;
      if (detail?.theme) setTheme(parseTheme(detail.theme));
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, onCustom);
    };
  }, [storageKey]);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next, storageKey);
  }

  const isDark = theme === "dark";
  const icon = isDark ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
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
