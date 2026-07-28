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
export type {
	ButtonProps,
	ButtonSize,
	ButtonVariant,
} from "./components/Button";
export { Button } from "./components/Button";
export type { CardPadding, CardProps } from "./components/Card";
export { Card } from "./components/Card";
export type {
	ConfirmDialogProps,
	ConfirmDialogTone,
} from "./components/ConfirmDialog";
export { ConfirmDialog } from "./components/ConfirmDialog";
export type { DataTableColumn } from "./components/DataTable";
export { DataTable, tableFilters } from "./components/DataTable";
export type { DialogProps, DialogSize } from "./components/Dialog";
export { Dialog } from "./components/Dialog";
export type { FieldControlProps, FieldProps } from "./components/Field";
export { Field } from "./components/Field";
export type { InputProps } from "./components/Input";
export { Input } from "./components/Input";
export { KpiHero } from "./components/KpiHero";
export { Logo } from "./components/Logo";
export { MainContent } from "./components/MainContent";
export { PageHeader } from "./components/PageHeader";
export { Section } from "./components/Section";
export type { SelectProps } from "./components/Select";
export { Select } from "./components/Select";
export type { NavItem, SidebarUsuario } from "./components/Sidebar";
export { Sidebar } from "./components/Sidebar";
export type { TextareaProps } from "./components/Textarea";
export { Textarea } from "./components/Textarea";
export { ThemeToggle } from "./components/ThemeToggle";
export { Toasts } from "./components/Toasts";
// Lib
export { cn } from "./lib/cn";
export { categorical, colors } from "./lib/colors";
export { escaparCelulaCsv, montarCsv } from "./lib/csv";
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
export { SidebarProvider, useSidebar } from "./lib/sidebar-context";
export { THEME_STORAGE_KEY, themeInitScript } from "./lib/theme";
export type {
	ToastApi,
	ToastHandle,
	ToastItem,
	ToastType,
} from "./lib/toast-context";
export {
	TOAST_DURATION_MS,
	ToastProvider,
	useToast,
} from "./lib/toast-context";
