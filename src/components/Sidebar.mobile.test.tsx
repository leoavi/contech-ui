import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "../lib/sidebar-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const navItems = [
  { label: "Início", href: "/", modulo: "*", icon: <span aria-hidden>⌂</span> },
  {
    label: "Fila operacional",
    href: "/fila",
    modulo: "*",
    group: "operacao",
    icon: <span aria-hidden>≡</span>,
  },
];
const groups = [
  { key: "operacao", label: "Operação", icon: <span aria-hidden>◫</span> },
];

function renderSidebar() {
  return render(
    <SidebarProvider>
      <Sidebar navItems={navItems} groups={groups} usuario={{ login: "ana", modulos: ["*"] }} />
    </SidebarProvider>,
  );
}

function openDrawer() {
  const hamburger = screen.getByRole("button", { name: "Abrir menu" });
  hamburger.focus();
  fireEvent.click(hamburger);
  return {
    drawer: screen.getByRole("dialog", { name: "Menu de navegação" }),
    hamburger,
  };
}

afterEach(cleanup);

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("sidebar-collapsed", "true");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
  window.cancelAnimationFrame = vi.fn();
});

describe("drawer mobile da Sidebar", () => {
  it("abre expandido apesar do estado desktop persistido e expõe camadas e alvos móveis", () => {
    renderSidebar();
    const { drawer, hamburger } = openDrawer();

    expect(hamburger.getAttribute("aria-expanded")).toBe("true");
    expect(hamburger.classList).toContain("h-11");
    expect(hamburger.classList).toContain("w-11");
    expect(drawer.classList).toContain("z-[60]");
    expect(drawer.classList).toContain("md:z-10");
    expect(drawer.classList).toContain("visible");
    expect(drawer.classList).toContain("md:visible");
    const backdrop = drawer.previousElementSibling as HTMLElement;
    expect(backdrop.getAttribute("aria-hidden")).toBe("true");
    expect(backdrop.classList).toContain("z-50");

    const mainNav = within(drawer).getByRole("link", { name: "Início" });
    expect(within(drawer).getByText("Início")).toBeTruthy();
    expect(mainNav.classList).toContain("min-h-11");
    expect(mainNav.classList).toContain("md:min-h-0");
    const groupButton = within(drawer).getByRole("button", { name: "Operação" });
    expect(groupButton.classList).toContain("min-h-11");
    expect(groupButton.classList).toContain("md:min-h-0");
    fireEvent.click(groupButton);
    const groupedNav = within(drawer).getByRole("link", { name: "Fila operacional" });
    expect(groupedNav.classList).toContain("min-h-11");
    expect(groupedNav.classList).toContain("md:min-h-0");
  });

  it("remove drawer fechado da ordem de foco sem afetar a visibilidade desktop", () => {
    renderSidebar();
    const drawer = document.querySelector("aside")!;
    expect(drawer.classList).toContain("invisible");
    expect(drawer.classList).toContain("md:visible");
  });

  it("fecha pelo controle interno e devolve o foco ao opener", () => {
    renderSidebar();
    const { drawer, hamburger } = openDrawer();
    const closeButton = within(drawer).getByRole("button", { name: "Fechar menu" });
    expect(closeButton.classList).toContain("h-11");
    expect(closeButton.classList).toContain("w-11");
    expect(closeButton.classList).toContain("md:h-8");
    expect(closeButton.classList).toContain("md:w-8");
    expect(document.activeElement).toBe(closeButton);
    fireEvent.click(closeButton);
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();
    expect(document.activeElement).toBe(hamburger);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");
  });

  it("fecha com Escape e devolve o foco ao opener", () => {
    renderSidebar();
    const { hamburger } = openDrawer();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();
    expect(document.activeElement).toBe(hamburger);
  });

  it("fecha ao clicar no backdrop e devolve o foco ao opener", () => {
    renderSidebar();
    const { drawer, hamburger } = openDrawer();
    fireEvent.click(drawer.previousElementSibling as HTMLElement);
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();
    expect(document.activeElement).toBe(hamburger);
  });

  it("fecha ao navegar e devolve o foco ao opener", () => {
    renderSidebar();
    const { drawer, hamburger } = openDrawer();
    fireEvent.click(within(drawer).getByRole("link", { name: "Início" }));
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();
    expect(document.activeElement).toBe(hamburger);
  });

  it("mantém logout com alvo móvel e reset desktop", () => {
    renderSidebar();
    const { drawer } = openDrawer();
    const logout = within(drawer).getByTitle("Sair");
    expect(logout.classList).toContain("h-11");
    expect(logout.classList).toContain("w-11");
    expect(logout.classList).toContain("md:h-auto");
    expect(logout.classList).toContain("md:w-auto");
    expect(logout.classList).toContain("md:p-1.5");
    fireEvent.click(within(drawer).getByRole("button", { name: "Fechar menu" }));
    const collapsedLogout = screen.getByTitle("Sair");
    expect(collapsedLogout.classList).toContain("h-11");
    expect(collapsedLogout.classList).toContain("w-11");
    expect(collapsedLogout.classList).toContain("md:h-8");
    expect(collapsedLogout.classList).toContain("md:w-8");
  });
});
