"use client";

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
  const paddingX = collapsed ? "px-6" : "px-10";
  return (
    <main
      className={`min-h-screen ${paddingX} py-8 pb-24 transition-all duration-200 ease-in-out print:ml-0 print:px-0 print:pb-0 ${
        hasSidebar ? (collapsed ? "ml-10" : "ml-60") : "ml-0"
      }`}
    >
      <div className="mx-auto max-w-[1700px]">{children}</div>
    </main>
  );
}
