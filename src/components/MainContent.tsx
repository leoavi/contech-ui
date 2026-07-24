"use client";

import { useSidebar } from "../lib/sidebar-context";

/**
 * Wrapper do conteúdo principal que responde ao collapse da Sidebar.
 *
 * - sidebar expandida → `md:ml-60 md:px-10` (desktop idêntico ao histórico)
 * - sidebar colapsada → `md:ml-10 md:px-6`
 * - mobile (<md) → `ml-0` (drawer sobrepõe; pt-14 libera o hamburger)
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
  // px de hoje gateado em md:; base mobile usa px-4 pra não colar na borda.
  const paddingX = collapsed ? "px-4 md:px-6" : "px-4 md:px-10";
  // ml de hoje só em md+; base mobile sempre ml-0 (drawer off-canvas).
  const marginL = hasSidebar
    ? collapsed
      ? "ml-0 md:ml-10"
      : "ml-0 md:ml-60"
    : "ml-0";
  return (
    <main
      className={`min-h-screen ${paddingX} pt-14 pb-24 md:pt-8 transition-all duration-200 ease-in-out print:ml-0 print:px-0 print:pb-0 ${marginL}`}
    >
      <div className="mx-auto max-w-[1700px]">{children}</div>
    </main>
  );
}
