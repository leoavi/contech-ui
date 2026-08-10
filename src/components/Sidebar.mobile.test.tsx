import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "../lib/sidebar-context";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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
  it("abre expandido apesar do estado desktop persistido e fecha pelo controle interno", () => {
    render(
      <SidebarProvider>
        <Sidebar
          navItems={[
            {
              label: "Início",
              href: "/",
              modulo: "*",
              icon: <span aria-hidden>⌂</span>,
            },
          ]}
          usuario={{ login: "ana", modulos: ["*"] }}
        />
      </SidebarProvider>,
    );

    const hamburger = screen.getByRole("button", { name: "Abrir menu" });
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    expect(hamburger.classList).toContain("h-11");

    fireEvent.click(hamburger);

    const drawer = screen.getByRole("dialog", { name: "Menu de navegação" });
    expect(drawer.classList).toContain("z-[60]");
    const closeButton = within(drawer).getByRole("button", { name: "Fechar menu" });
    expect(closeButton).toBeTruthy();
    expect(screen.getByRole("link", { name: "Início" })).toBeTruthy();
    expect(within(drawer).getByText("Início")).toBeTruthy();

    fireEvent.click(closeButton);
    expect(screen.queryByRole("dialog", { name: "Menu de navegação" })).toBeNull();
  });
});
