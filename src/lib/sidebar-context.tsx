"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Context global do estado collapsed/expandido da Sidebar.
 *
 * Persiste em localStorage e expõe `--sidebar-width` como CSS var
 * pra que componentes possam reagir via CSS sem re-render.
 *
 * Padrão: cada app envolve seu root com <SidebarProvider> e usa
 * <Sidebar /> + <MainContent /> que automaticamente leem o context.
 */

interface SidebarCtx {
  collapsed: boolean;
  toggle: () => void;
  /** Drawer mobile aberto (telas < lg). */
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarCtx>({
  collapsed: false,
  toggle: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

const STORAGE_KEY = "sidebar-collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "64px" : "240px",
    );
  }, [collapsed]);

  // Sync inicial sem flash
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === "true";
    setCollapsed(saved);
    document.documentElement.style.setProperty(
      "--sidebar-width",
      saved ? "64px" : "240px",
    );
  }, []);

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle: () => setCollapsed((v) => !v), mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
