"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "../lib/cn";
import { useSidebar } from "../lib/sidebar-context";
import { Logo } from "./Logo";

/**
 * Sidebar canônica Contech — extraída do ContransBI (canon visual) em 2026-05-20.
 *
 * Comportamento:
 * - Collapse via useSidebar() (persistido em localStorage) — md+
 * - Mobile (<md): drawer off-canvas + hamburger; md+ pixel-idêntico ao legado
 * - Item ativo: preenchimento `bg-bordo-700 text-on-bordo` (tinta estrutural)
 * - Hover inativo: `bg-nav-hover` sobre superfície `bg-nav`
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

/** Configuração de um accordion nomeado (multi-grupo). */
export interface SidebarGroup {
  /** Casa com `NavItem.group`. */
  key: string;
  label: string;
  icon?: ReactNode;
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
  /** Label do accordion quando há items agrupados (default: "Agents"). Legado/single-group. */
  groupLabel?: string;
  /** Ícone do accordion (default: cubo). Legado/single-group. */
  groupIcon?: ReactNode;
  /**
   * Multi-grupo: define um accordion por entrada, casando `NavItem.group` com `key`.
   * Quando informado, ignora groupLabel/groupIcon e renderiza vários accordions.
   */
  groups?: SidebarGroup[];
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

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  });
}

export function Sidebar({
  navItems,
  usuario,
  logoutPath = "/api/auth/logout/",
  loginPath = "/login",
  extras,
  groupLabel = "Agents",
  groupIcon = DEFAULT_GROUP_ICON,
  groups,
}: SidebarProps) {
  const activePath = usePathname() ?? "/";
  const { collapsed, toggle, mobileOpen, setMobileOpen, toggleMobile } =
    useSidebar();
  const router = useRouter();
  const drawerId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const accessibleItems = navItems.filter((item) =>
    temAcesso(usuario.modulos, item.modulo),
  );
  const multiGroup = !!groups && groups.length > 0;
  const groupedItems = accessibleItems.filter((item) => item.group);
  const mainItems = accessibleItems.filter((item) => !item.group);
  const hasGrouped = groupedItems.length > 0;
  const groupedActive = groupedItems.some(
    (item) => activePath === item.href || activePath.startsWith(item.href),
  );

  const itemAtivo = (item: NavItem) =>
    activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));

  const [groupOpen, setGroupOpen] = useState(() => groupedActive);
  // Multi-grupo: estado aberto/fechado por chave (abre os que contêm rota ativa).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {};
    if (groups) {
      for (const g of groups) {
        o[g.key] = accessibleItems.some((it) => it.group === g.key && itemAtivo(it));
      }
    }
    return o;
  });

  const closeMobile = useCallback(() => setMobileOpen(false), [setMobileOpen]);

  // Focus trap + Esc + scroll-lock + retorno de foco — só no drawer mobile aberto.
  useEffect(() => {
    if (!mobileOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusInitial = () => {
      const panel = drawerRef.current;
      if (!panel) return;
      const focusable = getFocusable(panel);
      (focusable[0] ?? panel).focus();
    };
    const raf = requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = drawerRef.current;
      if (!panel) return;

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === panel || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = prevOverflow;
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") {
        prev.focus();
      }
      previousFocusRef.current = null;
    };
  }, [mobileOpen, setMobileOpen]);

  async function handleLogout() {
    await fetch(logoutPath, { method: "POST" });
    router.push(loginPath);
    router.refresh();
  }

  // Desktop (md+): w-10 | w-60 como sempre. Mobile: drawer w-72.
  const desktopW = collapsed ? "md:w-10" : "md:w-60";

  return (
    <>
      {/* Hamburger — só <md; não existe no desktop. */}
      <button
        type="button"
        onClick={toggleMobile}
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls={drawerId}
        className={cn(
          "no-print fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center",
          "rounded-md border border-chumbo-100 bg-white text-chumbo-700 shadow-sm",
          "transition-colors hover:bg-chumbo-100/60 hover:text-chumbo-950",
          "md:hidden",
        )}
      >
        <HamburgerIcon />
      </button>

      {/* Backdrop — só mobile + só quando drawer aberto. */}
      {mobileOpen ? (
        <div
          className="no-print fixed inset-0 z-40 bg-preto/60 md:hidden"
          aria-hidden
          onClick={closeMobile}
        />
      ) : null}

      <aside
        id={drawerId}
        ref={drawerRef}
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? "Menu de navegação" : undefined}
        tabIndex={mobileOpen ? -1 : undefined}
        className={cn(
          // Base compartilhada + apresentação desktop legada gateada em md:
          "no-print fixed inset-y-0 left-0 flex flex-col border-r border-chumbo-100 bg-nav",
          "transition-[width,transform] duration-200 ease-in-out",
          // Mobile: drawer off-canvas w-72, z alto
          "z-50 w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop (md+): EXATAMENTE o aside de sempre — fixo, z-10, w-10|w-60, sempre visível
          "md:z-10 md:translate-x-0",
          desktopW,
        )}
      >
        {/* Header: Logo + toggle (collapse desktop) */}
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
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-chumbo-500 transition-colors hover:bg-nav-hover hover:text-chumbo-950",
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
                onNavigate={closeMobile}
              />
            ))}

            {multiGroup
              ? groups?.map((g) => {
                  const items = accessibleItems.filter((it) => it.group === g.key);
                  if (items.length === 0) return null;
                  const active = items.some(itemAtivo);
                  const open = openGroups[g.key] ?? false;
                  return (
                    <Fragment key={g.key}>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            if (collapsed) return;
                            setOpenGroups((s) => ({ ...s, [g.key]: !s[g.key] }));
                          }}
                          title={collapsed ? g.label : undefined}
                          className={cn(
                            "relative flex w-full items-center rounded-md py-2 text-sm font-medium transition-colors",
                            collapsed ? "justify-center px-1" : "gap-3 px-2",
                            // Grupo ativo recebe só realce sutil (negrito escuro);
                            // o vermelho forte fica reservado ao item-folha ativo.
                            active
                              ? "font-semibold text-chumbo-950 hover:bg-nav-hover"
                              : "text-chumbo-700 hover:bg-nav-hover",
                          )}
                        >
                          {g.icon ?? DEFAULT_GROUP_ICON}
                          {!collapsed && (
                            <>
                              <span className="truncate">{g.label}</span>
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                className={cn(
                                  "ml-auto h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                                  open && "rotate-180",
                                )}
                                aria-hidden
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </>
                          )}
                        </button>
                      </li>
                      {(open || collapsed) &&
                        items.map((item) => (
                          <NavRow
                            key={item.href}
                            item={item}
                            activePath={activePath}
                            collapsed={collapsed}
                            nested
                            onNavigate={closeMobile}
                          />
                        ))}
                    </Fragment>
                  );
                })
              : hasGrouped && (
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
                            ? "font-semibold text-chumbo-950 hover:bg-nav-hover"
                            : "text-chumbo-700 hover:bg-nav-hover",
                        )}
                      >
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
                          onNavigate={closeMobile}
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
              className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-chumbo-500 transition-colors hover:bg-nav-hover hover:text-negative"
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
                className="flex-shrink-0 rounded-md p-1.5 text-chumbo-500 transition-colors hover:bg-nav-hover hover:text-negative"
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
  onNavigate,
}: {
  item: NavItem;
  activePath: string;
  collapsed: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const isActive =
    activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));
  const base = cn(
    "relative flex h-9 items-center rounded-lg text-sm font-medium transition-colors",
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
        onClick={() => onNavigate?.()}
        className={cn(
          base,
          isActive
            ? "bg-bordo-700 text-on-bordo hover:bg-bordo-600"
            : "text-chumbo-700 hover:bg-nav-hover",
        )}
      >
        <span className={cn("flex-shrink-0", isActive && "text-on-bordo")}>
          {item.icon}
        </span>
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

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
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
