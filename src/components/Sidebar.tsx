"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { useSidebar } from "../lib/sidebar-context";
import { Logo } from "./Logo";

/**
 * Sidebar canônica Contech — extraída do ContransBI (canon visual) em 2026-05-20.
 *
 * Comportamento:
 * - Collapse via useSidebar() (persistido em localStorage)
 * - Item ativo: `bg-bordo-50 text-bordo-700` + barra lateral 3px
 * - Hover: `bg-chumbo-100/60`
 * - Items com `group` viram accordion (default: "Agents", configurável)
 * - Items com `disabled: true` mostram label "em breve" sem link
 * - Footer com avatar (iniciais), nome, login e botão logout
 * - Filtro por permissões: passa `modulosPermitidos` + cada item tem `modulo`
 *
 * Uso:
 *   const NAV: NavItem[] = [{ label: "Início", href: "/", modulo: "*", icon: <Icon ... /> }];
 *   <SidebarProvider>
 *     <Sidebar navItems={NAV} usuario={{ login, nome, modulos }} />
 *     <MainContent>{children}</MainContent>
 *   </SidebarProvider>
 */

export interface NavItem {
  label: string;
  href: string;
  /** Módulo necessário no array de permissões do usuário. Use "*" pra sempre liberado. */
  modulo: string;
  /** Mostra item cinza com "em breve" — não navega. */
  disabled?: boolean;
  icon: ReactNode;
  /** Items com mesmo `group` viram accordion expansível. */
  group?: string;
}

export interface SidebarUsuario {
  login: string;
  nome?: string;
  modulos: string[];
}

interface SidebarProps {
  navItems: NavItem[];
  usuario: SidebarUsuario;
  /** Caminho do POST de logout (default: /api/auth/logout/). */
  logoutPath?: string;
  /** Pra onde redirecionar após logout (default: /login). */
  loginPath?: string;
  /** Slot opcional acima do footer (ex: badge de mês ativo do BI). */
  extras?: ReactNode;
  /** Label do accordion quando há items agrupados (default: "Agents"). */
  groupLabel?: string;
  /** Ícone do accordion (default: cubo). */
  groupIcon?: ReactNode;
}

function temAcesso(modulos: string[], modulo: string): boolean {
  if (modulo === "*") return true;
  if (modulos.includes("*")) return true;
  return modulos.includes(modulo);
}

const DEFAULT_GROUP_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-[18px] w-[18px] flex-shrink-0"
    aria-hidden
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export function Sidebar({
  navItems,
  usuario,
  logoutPath = "/api/auth/logout/",
  loginPath = "/login",
  extras,
  groupLabel = "Agents",
  groupIcon = DEFAULT_GROUP_ICON,
}: SidebarProps) {
  const activePath = usePathname() ?? "/";
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();
  const router = useRouter();

  const accessibleItems = navItems.filter((item) =>
    temAcesso(usuario.modulos, item.modulo),
  );
  const groupedItems = accessibleItems.filter((item) => item.group);
  const mainItems = accessibleItems.filter((item) => !item.group);
  const hasGrouped = groupedItems.length > 0;
  const groupedActive = groupedItems.some(
    (item) => activePath === item.href || activePath.startsWith(item.href),
  );

  const [groupOpen, setGroupOpen] = useState(() => groupedActive);

  // Fecha o drawer mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [activePath, setMobileOpen]);

  async function handleLogout() {
    await fetch(logoutPath, { method: "POST" });
    router.push(loginPath);
    router.refresh();
  }

  const w = collapsed ? "w-10" : "w-60";

  return (
    <>
      {/* Botão hambúrguer — só em mobile (< lg) */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="no-print fixed top-3 left-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-chumbo-100 bg-white text-chumbo-700 shadow-md lg:hidden"
        title="Abrir menu"
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Overlay quando o drawer mobile está aberto */}
      {mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 z-20 bg-black/40 lg:hidden"
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-30 flex flex-col border-r border-chumbo-100 bg-white transition-[width,transform] duration-200 ease-in-out",
          w,
          // Mobile: drawer que desliza. Desktop (lg): sempre visível.
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:z-10",
        )}
      >
      {/* Header: Logo + toggle */}
      <div
        className={cn(
          "flex h-16 items-center justify-between",
          collapsed ? "px-1" : "px-3",
        )}
      >
        {!collapsed && (
          <div className="overflow-hidden">
            <Logo size="md" />
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "Expandir menu" : "Minimizar menu"}
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-chumbo-500 transition-colors hover:bg-chumbo-100/60 hover:text-chumbo-950",
            collapsed && "mx-auto",
          )}
        >
          <ChevronIcon dir={collapsed ? "right" : "left"} />
        </button>
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-1", collapsed ? "px-1" : "px-2")}>
        <ul className="flex flex-col gap-0.5">
          {mainItems.map((item) => (
            <NavRow
              key={item.href}
              item={item}
              activePath={activePath}
              collapsed={collapsed}
            />
          ))}

          {hasGrouped && (
            <>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) return;
                    setGroupOpen((o) => !o);
                  }}
                  title={collapsed ? groupLabel : undefined}
                  className={cn(
                    "relative flex w-full items-center rounded-md py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-1" : "gap-3 px-2",
                    groupedActive
                      ? "bg-bordo-50 text-bordo-700"
                      : "text-chumbo-700 hover:bg-chumbo-100/60",
                  )}
                >
                  {groupedActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-bordo-700" />
                  )}
                  {groupIcon}
                  {!collapsed && (
                    <>
                      <span className="truncate">{groupLabel}</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        className={cn(
                          "ml-auto h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                          groupOpen && "rotate-180",
                        )}
                        aria-hidden
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </>
                  )}
                </button>
              </li>
              {(groupOpen || collapsed) &&
                groupedItems.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    activePath={activePath}
                    collapsed={collapsed}
                    nested
                  />
                ))}
            </>
          )}
        </ul>
      </nav>

      {extras}

      {/* Footer: usuário + logout */}
      <div
        className={cn(
          "border-t border-chumbo-100 py-3",
          collapsed ? "px-1" : "px-2",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-chumbo-500 transition-colors hover:bg-chumbo-100/60 hover:text-negative"
          >
            <LogoutIcon />
          </button>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bordo-50 text-[11px] font-bold text-bordo-700">
              {(usuario.nome ?? usuario.login).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-chumbo-950">
                {usuario.nome ?? usuario.login}
              </div>
              <div className="truncate text-[10px] text-chumbo-500">
                {usuario.login}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sair"
              className="flex-shrink-0 rounded-md p-1.5 text-chumbo-500 transition-colors hover:bg-chumbo-100/60 hover:text-negative"
            >
              <LogoutIcon small />
            </button>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}

// ─── Internals ───────────────────────────────────────────────────────────────

function NavRow({
  item,
  activePath,
  collapsed,
  nested = false,
}: {
  item: NavItem;
  activePath: string;
  collapsed: boolean;
  nested?: boolean;
}) {
  const isActive =
    activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));
  const base = cn(
    "relative flex items-center rounded-md py-2 text-sm font-medium transition-colors",
    collapsed ? "justify-center px-1" : nested ? "gap-3 px-2 pl-7" : "gap-3 px-2",
  );

  if (item.disabled) {
    return (
      <li>
        <span
          title={collapsed ? item.label : undefined}
          className={cn(base, "cursor-not-allowed text-chumbo-500/50")}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="truncate">{item.label}</span>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-chumbo-500/50">
                em breve
              </span>
            </>
          )}
        </span>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={cn(
          base,
          isActive
            ? "bg-bordo-50 text-bordo-700"
            : nested
              ? "text-chumbo-700 hover:bg-chumbo-100/60"
              : "text-chumbo-700 hover:bg-chumbo-100/60",
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-bordo-700" />
        )}
        {item.icon}
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d={dir === "right" ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
    </svg>
  );
}

function LogoutIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={small ? "h-4 w-4" : "h-[18px] w-[18px]"}
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
