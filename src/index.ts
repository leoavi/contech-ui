/**
 * @contech/ui — barrel exports.
 *
 * Importe via:
 *   import { PageHeader, Section, DataTable } from "@contech/ui";
 *
 * Para o CSS de tokens:
 *   @import "@contech/ui/styles/contech.css";   // no globals.css do app
 */

// Components
export { BordoBar } from "./components/BordoBar";
export { DataTable, tableFilters } from "./components/DataTable";
export type { DataTableColumn } from "./components/DataTable";
export { KpiHero } from "./components/KpiHero";
export { Logo } from "./components/Logo";
export { MainContent } from "./components/MainContent";
export { PageHeader } from "./components/PageHeader";
export { Section } from "./components/Section";
export { Sidebar } from "./components/Sidebar";
export type { NavItem, SidebarUsuario } from "./components/Sidebar";

// Lib
export { cn } from "./lib/cn";
export { SidebarProvider, useSidebar } from "./lib/sidebar-context";
export {
  defaultIntervalo,
  formatBRL,
  formatBRLK,
  formatBRLKForced,
  formatDateShort,
  formatDelta,
  formatInt,
  formatISODateBR,
  formatMonthLong,
  formatMonthShort,
  formatNumber,
  formatPercent,
  formatPercentValue,
} from "./lib/format";
export { categorical, colors } from "./lib/colors";
