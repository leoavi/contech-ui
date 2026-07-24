"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Context global do estado collapsed/expandido da Sidebar.
 *
 * Persiste em localStorage e expõe `--sidebar-width` como CSS var
 * pra que componentes possam reagir via CSS sem re-render.
 *
 * Padrão: cada app envolve seu root com <SidebarProvider> e usa
 * <Sidebar /> + <MainContent /> que automaticamente leem o context.
 *
 * Mobile (W1-C): `mobileOpen` controla o drawer off-canvas (<md).
 * Não persiste — some no reload. Desktop (md+) ignora esse estado.
 */

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  /** Drawer mobile aberto (<md). Default false. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
});

const STORAGE_KEY = "sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // SEMPRE false no 1º render — o server não tem localStorage e renderiza
  // expandido; se o inicializador lesse localStorage aqui, o 1º render do
  // client divergiria do server → hydration mismatch (React #418). O estado
  // salvo é aplicado logo após o mount, no useEffect abaixo.
  const [collapsed, setCollapsed] = useState(false);
  // Drawer mobile — não persiste; default false em server e 1º client render.
  const [mobileOpen, setMobileOpen] = useState(false);
  // Evita persistir no load inicial (antes do sync ler o valor salvo).
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "64px" : "240px",
    );
  }, [collapsed]);

  // Sync após o mount — aplica o estado salvo sem causar mismatch.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "true";
    hydrated.current = true;
    setCollapsed(saved);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      saved ? "64px" : "240px",
    );
  }, []);

  // Fecha o drawer mobile ao cruzar pra md+ (desktop não usa mobileOpen).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        toggle: () => setCollapsed((v) => !v),
        mobileOpen,
        setMobileOpen,
        toggleMobile: () => setMobileOpen((v) => !v),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
