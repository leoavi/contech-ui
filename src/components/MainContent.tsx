"use client";

import { cn } from "../lib/cn";
import { useSidebar } from "../lib/sidebar-context";

/**
 * Wrapper do conteúdo principal que responde ao collapse da Sidebar.
 *
 * - sidebar expandida → `ml-60 px-10`
 * - sidebar colapsada → `ml-10 px-6` (mais conteúdo aproveitável)
 * - sem sidebar (login etc) → `ml-0`
 * - print → reseta margens
 *
 * Max-width 1700px centralizado por dentro pra evitar linhas de texto enormes
 * em monitores ultra-wide.
 */
export function MainContent({
  children,
  hasSidebar = true,
}: {
  children: React.ReactNode;
  hasSidebar?: boolean;
}) {
  const { collapsed } = useSidebar();
  // Mobile (< lg): sem margem (sidebar vira drawer sobreposto) + padding menor
  // + espaço no topo pro botão hambúrguer. Desktop: margem conforme collapse.
  const desktopMl = hasSidebar ? (collapsed ? "lg:ml-10" : "lg:ml-60") : "lg:ml-0";
  const desktopPx = collapsed ? "lg:px-6" : "lg:px-10";
  return (
    <main
      className={cn(
        "min-h-screen ml-0 px-4 py-8 pb-24 transition-all duration-200 ease-in-out",
        hasSidebar && "max-lg:pt-16", // espaço pro botão hambúrguer
        desktopMl,
        desktopPx,
        "print:ml-0 print:px-0 print:pb-0",
      )}
    >
      <div className="mx-auto max-w-[1700px]">{children}</div>
    </main>
  );
}
