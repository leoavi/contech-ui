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
export { Button } from "./components/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./components/Button";
export { Card } from "./components/Card";
export type { CardPadding, CardProps } from "./components/Card";
export { DataTable, tableFilters } from "./components/DataTable";
export type { DataTableColumn } from "./components/DataTable";
export { Field } from "./components/Field";
export type { FieldControlProps, FieldProps } from "./components/Field";
export { Input } from "./components/Input";
export type { InputProps } from "./components/Input";
export { KpiHero } from "./components/KpiHero";
export { Logo } from "./components/Logo";
export { MainContent } from "./components/MainContent";
export { PageHeader } from "./components/PageHeader";
export { Section } from "./components/Section";
export { Select } from "./components/Select";
export type { SelectProps } from "./components/Select";
export { Sidebar } from "./components/Sidebar";
export type { NavItem, SidebarUsuario } from "./components/Sidebar";
export { Textarea } from "./components/Textarea";
export type { TextareaProps } from "./components/Textarea";
export { ThemeToggle } from "./components/ThemeToggle";
export { themeInitScript, THEME_STORAGE_KEY } from "./lib/theme";

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
