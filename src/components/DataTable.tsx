"use client";

/**
 * DataTable — componente padrão de tabela de listagem do ContransBI.
 *
 * Padroniza (decisão arquitetural 18/05/2026 com Leonardo):
 *   - Sort por click no header (asc → desc → null), indicador ↑↓
 *   - Filtro por coluna via ícone de funil → popover (text | select | numberRange)
 *   - Paginação clássica (pageSize default 10); counter no rodapé
 *   - Overflow horizontal no wrapper interno (overflow-x-auto + min-w na table)
 *     para colunas largas em viewport estreita — página NÃO ganha scroll lateral
 *   - Filtro de coluna via portal (fora do contexto de recorte do scroll)
 *   - Linha expansível inline (drill-down) opcional
 *
 * Sticky header: o comentário histórico ("header sticky") referia a era
 * maxVisibleRows/altura fixa. Com paginação não há scroll vertical interno;
 * `thead` não usa position:sticky. Um ancestral overflow-x-auto também
 * recria scroll containment — se sticky voltar no futuro, testar com o
 * container de scroll vertical no mesmo elemento do overflow-x.
 *
 * NÃO se aplica a: pivots (DRE, frota faturamento, armazem ocupacao),
 * heatmaps e grids declarativos (arquitetura).
 *
 * Motor: TanStack Table v8 (headless).
 */

import {
	type Column,
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type Row,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { montarCsv } from "../lib/csv";

export type DataTableColumn<T> = ColumnDef<T> & {
	/** Tipo de filtro a expor no popover. `false` desabilita. */
	filter?: "text" | "select" | "numberRange" | false;
	/** Alinhamento da célula. Default: "left". */
	align?: "left" | "center" | "right";
};

interface DataTableProps<T> {
	data: T[];
	columns: DataTableColumn<T>[];
	/** Chave única do registro (usada para keys de React). */
	rowKey: (row: T) => string | number;
	/** Sort inicial. */
	initialSort?: SortingState;
	/** Filtros aplicados por padrão (ex: status=andamento) — usuário pode alterar. */
	initialColumnFilters?: ColumnFiltersState;
	/** Callback disparado quando o usuário altera filtros — útil pra persistir em URL/localStorage. */
	onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
	/** Linha expansível inline (drill-down). */
	expandable?: (row: T) => ReactNode;
	/** Linhas por página. Default: 10. Use 0 pra desligar paginação. */
	pageSize?: number;
	/** @deprecated Substituído por paginação clássica. Mantido pra compatibilidade. */
	maxVisibleRows?: number;
	/** @deprecated Sem efeito após a migração pra paginação. */
	estimatedRowHeight?: number;
	/** Mensagem quando não há dados. */
	emptyMessage?: string;
	/**
	 * Se informado, exibe botão "Exportar CSV" no rodapé.
	 * Recebe os dados filtrados e retorna array de objetos planos {coluna: valor}.
	 * Use quando a coluna tem célula customizada (ex: formatBRL) e você quer o valor bruto no CSV.
	 * Se não informado mas `exportCsv: true`, usa os valores raw do TanStack.
	 */
	exportCsv?:
		| true
		| ((rows: T[]) => Record<string, string | number | null | undefined>[]);
	/** Nome do arquivo CSV exportado (sem extensão). Default: "dados". */
	exportFileName?: string;
}

function exportToCsv(
	rows: Record<string, string | number | null | undefined>[],
	fileName: string,
) {
	if (rows.length === 0) return;
	const csv = montarCsv(rows);
	const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${fileName}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}

export function DataTable<T>({
	data,
	columns,
	rowKey,
	initialSort = [],
	initialColumnFilters = [],
	onColumnFiltersChange,
	expandable,
	pageSize = 10,
	emptyMessage = "Sem registros para exibir.",
	exportCsv,
	exportFileName = "dados",
}: DataTableProps<T>) {
	const [sorting, setSorting] = useState<SortingState>(initialSort);
	const [columnFilters, setColumnFiltersState] =
		useState<ColumnFiltersState>(initialColumnFilters);
	const setColumnFilters: typeof setColumnFiltersState = (updater) => {
		setColumnFiltersState((prev) => {
			const next = typeof updater === "function" ? updater(prev) : updater;
			onColumnFiltersChange?.(next);
			return next;
		});
	};
	const [expanded, setExpanded] = useState<Set<string | number>>(new Set());
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: pageSize > 0 ? pageSize : data.length || 1,
	});

	const paginar = pageSize > 0;

	const table = useReactTable({
		data,
		columns,
		state: { sorting, columnFilters, pagination },
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		...(paginar ? { getPaginationRowModel: getPaginationRowModel() } : {}),
	});

	const totalRegistros = data.length;
	const totalFiltrados = table.getFilteredRowModel().rows.length;
	const visibleRows = paginar
		? table.getRowModel().rows
		: table.getFilteredRowModel().rows;
	const totalPaginas = paginar
		? Math.max(1, Math.ceil(totalFiltrados / pagination.pageSize))
		: 1;
	const paginaAtual = pagination.pageIndex + 1;

	// Quando o conjunto filtrado encolhe, recoloca o índice de página dentro do range.
	useEffect(() => {
		if (
			paginar &&
			pagination.pageIndex > 0 &&
			pagination.pageIndex >= totalPaginas
		) {
			setPagination((p) => ({
				...p,
				pageIndex: Math.max(0, totalPaginas - 1),
			}));
		}
	}, [paginar, totalPaginas, pagination.pageIndex]);

	function toggleExpand(key: string | number) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	return (
		// Outer: borda + radius (sem overflow — evita cortar cantos no eixo de scroll).
		// Inner: overflow-x-auto isola a rolagem horizontal; a página não rola de lado.
		// table: min-w-full (preenche quando há poucas colunas) + w-max (estoura quando não cabe).
		<div className="rounded-lg border border-chumbo-100 bg-white">
			<div className="overflow-x-auto">
				<table className="w-max min-w-full text-sm">
					<thead className="bg-white/95">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr
								key={headerGroup.id}
								className="border-b border-chumbo-100 text-[11px] uppercase tracking-wide text-chumbo-500"
							>
								{headerGroup.headers.map((header) => {
									const meta = header.column.columnDef as DataTableColumn<T>;
									const align = meta.align ?? "left";
									const canSort = header.column.getCanSort();
									const sortDir = header.column.getIsSorted();
									const filterType = meta.filter;
									return (
										<th
											key={header.id}
											className={cn(
												"whitespace-nowrap px-4 py-3 font-semibold",
												align === "right" && "text-right",
												align === "center" && "text-center",
												align === "left" && "text-left",
											)}
										>
											<div
												className={cn(
													"flex items-center gap-1.5",
													align === "right" && "justify-end",
													align === "center" && "justify-center",
												)}
											>
												<button
													type="button"
													onClick={
														canSort
															? header.column.getToggleSortingHandler()
															: undefined
													}
													disabled={!canSort}
													className={cn(
														"inline-flex items-center gap-1 transition-colors",
														canSort && "cursor-pointer hover:text-chumbo-950",
														!canSort && "cursor-default",
													)}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{canSort && <SortIndicator dir={sortDir} />}
												</button>
												{filterType && (
													<FilterPopover
														column={header.column}
														type={filterType}
														data={data}
														popoverAlign={align === "right" ? "right" : "left"}
													/>
												)}
											</div>
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{visibleRows.length === 0 ? (
							<tr>
								<td
									colSpan={table.getAllColumns().length}
									className="px-4 py-10 text-center text-xs italic text-chumbo-500"
								>
									{emptyMessage}
								</td>
							</tr>
						) : (
							visibleRows.map((row) => {
								const key = rowKey(row.original);
								const isExpanded = expandable != null && expanded.has(key);
								return (
									<RenderRow
										key={key}
										row={row}
										expandable={expandable}
										isExpanded={isExpanded}
										onToggleExpand={() => toggleExpand(key)}
									/>
								);
							})
						)}
					</tbody>
				</table>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-3 border-t border-chumbo-100/40 bg-white/30 px-4 py-2 text-[11px] text-chumbo-500">
				<div className="flex flex-wrap items-center gap-3">
					<div>
						{totalFiltrados === totalRegistros ? (
							<>
								<span className="tabular text-chumbo-700">
									{totalFiltrados}
								</span>{" "}
								registro
								{totalFiltrados === 1 ? "" : "s"}
							</>
						) : (
							<>
								<span className="tabular text-chumbo-700">
									{totalFiltrados}
								</span>{" "}
								de{" "}
								<span className="tabular text-chumbo-700">
									{totalRegistros}
								</span>{" "}
								registros
								<span className="ml-1 text-chumbo-500">(filtro ativo)</span>
							</>
						)}
						{paginar && totalFiltrados > 0 && (
							<span className="ml-2 text-chumbo-500">
								· página{" "}
								<span className="tabular text-chumbo-700">{paginaAtual}</span>{" "}
								de{" "}
								<span className="tabular text-chumbo-700">{totalPaginas}</span>
							</span>
						)}
					</div>
					{exportCsv && totalFiltrados > 0 && (
						<button
							type="button"
							onClick={() => {
								const filteredRows = table
									.getFilteredRowModel()
									.rows.map((r) => r.original);
								if (typeof exportCsv === "function") {
									exportToCsv(exportCsv(filteredRows), exportFileName);
								} else {
									// exportCsv === true: usa valores raw das colunas acessíveis
									const rows = filteredRows.map((row) => {
										const obj: Record<
											string,
											string | number | null | undefined
										> = {};
										for (const col of columns) {
											const header =
												typeof col.header === "string"
													? col.header
													: (col.id ?? "");
											const key =
												(col as DataTableColumn<T> & { accessorKey?: string })
													.accessorKey ??
												col.id ??
												"";
											obj[header] = (row as Record<string, unknown>)[key] as
												| string
												| number
												| null
												| undefined;
										}
										return obj;
									});
									exportToCsv(rows, exportFileName);
								}
							}}
							className="inline-flex items-center gap-1 rounded border border-chumbo-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chumbo-700 transition-colors hover:border-bordo-700 hover:text-bordo-700"
						>
							<svg
								width="10"
								height="10"
								viewBox="0 0 16 16"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								aria-hidden="true"
							>
								<path
									d="M8 2v9m0 0-3-3m3 3 3-3M3 13h10"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							Exportar CSV
						</button>
					)}
				</div>
				{paginar && totalPaginas > 1 && (
					<Pagination
						paginaAtual={paginaAtual}
						totalPaginas={totalPaginas}
						onChange={(p) => setPagination((s) => ({ ...s, pageIndex: p - 1 }))}
					/>
				)}
			</div>
		</div>
	);
}

function Pagination({
	paginaAtual,
	totalPaginas,
	onChange,
}: {
	paginaAtual: number;
	totalPaginas: number;
	onChange: (p: number) => void;
}) {
	const paginas = useMemo(
		() => construirPaginacao(paginaAtual, totalPaginas),
		[paginaAtual, totalPaginas],
	);
	return (
		<nav className="flex items-center gap-1" aria-label="Paginação">
			<PageButton
				disabled={paginaAtual === 1}
				onClick={() => onChange(Math.max(1, paginaAtual - 1))}
				ariaLabel="Página anterior"
			>
				‹
			</PageButton>
			{paginas.map((p, i) =>
				p === "…" ? (
					<span key={`gap-${i}`} className="px-1 text-chumbo-500">
						…
					</span>
				) : (
					<PageButton
						key={p}
						active={p === paginaAtual}
						onClick={() => onChange(p)}
						ariaLabel={`Ir para página ${p}`}
					>
						{p}
					</PageButton>
				),
			)}
			<PageButton
				disabled={paginaAtual === totalPaginas}
				onClick={() => onChange(Math.min(totalPaginas, paginaAtual + 1))}
				ariaLabel="Próxima página"
			>
				›
			</PageButton>
		</nav>
	);
}

function PageButton({
	children,
	onClick,
	active = false,
	disabled = false,
	ariaLabel,
}: {
	children: ReactNode;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	ariaLabel?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			aria-current={active ? "page" : undefined}
			className={cn(
				"min-w-[26px] rounded px-2 py-1 text-[11px] font-semibold tabular transition-colors",
				active && "bg-bordo-700 text-white",
				!active && !disabled && "text-chumbo-700 hover:bg-chumbo-100",
				disabled && "cursor-not-allowed text-chumbo-300",
			)}
		>
			{children}
		</button>
	);
}

/** Gera lista de páginas com elipses no estilo 1 … 4 5 [6] 7 8 … 20 */
function construirPaginacao(atual: number, total: number): (number | "…")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const paginas: (number | "…")[] = [1];
	const ini = Math.max(2, atual - 2);
	const fim = Math.min(total - 1, atual + 2);
	if (ini > 2) paginas.push("…");
	for (let p = ini; p <= fim; p++) paginas.push(p);
	if (fim < total - 1) paginas.push("…");
	paginas.push(total);
	return paginas;
}

function RenderRow<T>({
	row,
	expandable,
	isExpanded,
	onToggleExpand,
}: {
	row: Row<T>;
	expandable?: (row: T) => ReactNode;
	isExpanded: boolean;
	onToggleExpand: () => void;
}) {
	const clickable = expandable != null;
	return (
		<>
			<tr
				onClick={clickable ? onToggleExpand : undefined}
				className={cn(
					// dt-row/dt-row-ativa: ganchos pros apps estilizarem hover/seleção por tema
					// (ex.: Gestão light usa bordo-50 + marcador; ver globals.css do app).
					"dt-row border-b border-chumbo-100/40 transition-colors",
					clickable && "cursor-pointer hover:bg-white/30",
					isExpanded && "dt-row-ativa bg-white/40",
				)}
			>
				{row.getVisibleCells().map((cell) => {
					const meta = cell.column.columnDef as DataTableColumn<T>;
					const align = meta.align ?? "left";
					return (
						<td
							key={cell.id}
							className={cn(
								"px-4 py-3",
								align === "right" && "text-right tabular",
								align === "center" && "text-center",
							)}
						>
							{flexRender(cell.column.columnDef.cell, cell.getContext())}
						</td>
					);
				})}
			</tr>
			{isExpanded && expandable && (
				<tr>
					<td
						colSpan={row.getVisibleCells().length}
						className="bg-white/20 px-4 py-4"
					>
						{expandable(row.original)}
					</td>
				</tr>
			)}
		</>
	);
}

function SortIndicator({ dir }: { dir: false | "asc" | "desc" }) {
	if (dir === false) {
		return <span className="text-chumbo-500 text-[10px]">↕</span>;
	}
	return (
		<span className="text-bordo-500 text-[10px]">
			{dir === "asc" ? "↑" : "↓"}
		</span>
	);
}

const FILTER_POPOVER_GAP = 4;
const FILTER_POPOVER_VIEWPORT_PAD = 8;
const FILTER_POPOVER_MIN_WIDTH = 200;

/**
 * Popover de filtro ancorado no botão via portal em document.body.
 * Sai do contexto de recorte de qualquer ancestral overflow (ex.: overflow-x-auto).
 * Posiciona com getBoundingClientRect + colisão com a viewport; fecha com
 * clique-fora e Escape; reposiciona em scroll (capture) e resize.
 */
function FilterPopover<T>({
	column,
	type,
	data,
	popoverAlign = "left",
}: {
	column: Column<T, unknown>;
	type: "text" | "select" | "numberRange";
	data: T[];
	popoverAlign?: "left" | "right";
}) {
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [coords, setCoords] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});
	const buttonRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const filterValue = column.getFilterValue();
	const hasFilter =
		filterValue != null &&
		filterValue !== "" &&
		!(
			Array.isArray(filterValue) &&
			filterValue.every((v) => v == null || v === "")
		);

	const uniqueValues = useMemo(() => {
		if (type !== "select") return [];
		const vals = new Set<string>();
		for (const row of data) {
			const v = (column as Column<T, unknown>).accessorFn
				? (column as Column<T, unknown>).accessorFn?.(row, 0)
				: (row as Record<string, unknown>)[column.id];
			if (v != null && v !== "") vals.add(String(v));
		}
		return [...vals].sort();
	}, [data, column, type]);

	useEffect(() => {
		setMounted(true);
	}, []);

	const close = useCallback(() => {
		setOpen(false);
		// Devolve o foco ao gatilho para teclado/leitor de tela.
		buttonRef.current?.focus();
	}, []);

	const updatePosition = useCallback(() => {
		const btn = buttonRef.current;
		if (!btn) return;
		const rect = btn.getBoundingClientRect();
		const panel = panelRef.current;
		const panelWidth = panel?.offsetWidth ?? FILTER_POPOVER_MIN_WIDTH;
		const panelHeight = panel?.offsetHeight ?? 0;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const pad = FILTER_POPOVER_VIEWPORT_PAD;

		// Preferência: abaixo do botão; alinhamento left/right conforme a coluna.
		let top = rect.bottom + FILTER_POPOVER_GAP;
		let left =
			popoverAlign === "right" ? rect.right - panelWidth : rect.left;

		// Colisão horizontal com a viewport.
		if (left + panelWidth > vw - pad) left = vw - panelWidth - pad;
		if (left < pad) left = pad;

		// Colisão vertical: vira para cima se não couber embaixo.
		if (panelHeight > 0 && top + panelHeight > vh - pad) {
			const above = rect.top - panelHeight - FILTER_POPOVER_GAP;
			if (above >= pad) top = above;
			else top = Math.max(pad, vh - panelHeight - pad);
		}
		if (top < pad) top = pad;

		setCoords({ top, left });
	}, [popoverAlign]);

	// Posiciona no open e após medir o painel; escuta scroll (capture) + resize.
	useLayoutEffect(() => {
		if (!open) return;
		updatePosition();
		// 2º frame: painel já com tamanho real (conteúdo montado).
		const raf = requestAnimationFrame(() => updatePosition());

		const onScrollOrResize = () => updatePosition();
		window.addEventListener("scroll", onScrollOrResize, true);
		window.addEventListener("resize", onScrollOrResize);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", onScrollOrResize, true);
			window.removeEventListener("resize", onScrollOrResize);
		};
	}, [open, updatePosition, type, hasFilter]);

	// Clique-fora + Escape.
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				close();
			}
		};
		const onPointerDown = (e: MouseEvent) => {
			const target = e.target as Node;
			if (panelRef.current?.contains(target)) return;
			if (buttonRef.current?.contains(target)) return;
			close();
		};
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("mousedown", onPointerDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.removeEventListener("mousedown", onPointerDown);
		};
	}, [open, close]);

	// Foco no primeiro campo ao abrir.
	useEffect(() => {
		if (!open) return;
		const raf = requestAnimationFrame(() => {
			const el = panelRef.current?.querySelector<HTMLElement>(
				"input, select, button",
			);
			el?.focus();
		});
		return () => cancelAnimationFrame(raf);
	}, [open, type]);

	const panel =
		open && mounted
			? createPortal(
					<div
						ref={panelRef}
						role="dialog"
						aria-label="Filtrar coluna"
						className="fixed z-50 min-w-[200px] rounded-md border border-chumbo-100 bg-white p-2 shadow-xl"
						style={{
							top: coords.top,
							left: coords.left,
							colorScheme: "dark",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{type === "text" && (
							<input
								type="text"
								placeholder="Filtrar..."
								value={(filterValue as string) ?? ""}
								onChange={(e) =>
									column.setFilterValue(e.target.value || undefined)
								}
								className="w-full rounded border border-chumbo-100 bg-offwhite px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-300 focus:border-bordo-700 focus:outline-none"
							/>
						)}
						{type === "select" && (
							<select
								value={(filterValue as string) ?? ""}
								onChange={(e) =>
									column.setFilterValue(e.target.value || undefined)
								}
								className="w-full rounded border border-chumbo-100 bg-offwhite px-2 py-1 text-xs text-chumbo-950 focus:border-bordo-700 focus:outline-none"
								style={{ colorScheme: "dark" }}
							>
								<option value="">Todos</option>
								{uniqueValues.map((v) => (
									<option key={v} value={v}>
										{v}
									</option>
								))}
							</select>
						)}
						{type === "numberRange" && (
							<div className="flex flex-col gap-1.5">
								<input
									type="number"
									placeholder="Min"
									value={(filterValue as [number?, number?])?.[0] ?? ""}
									onChange={(e) => {
										const min =
											e.target.value === ""
												? undefined
												: Number(e.target.value);
										const current = (filterValue as [number?, number?]) ?? [
											undefined,
											undefined,
										];
										column.setFilterValue([min, current[1]]);
									}}
									className="w-full rounded border border-chumbo-100 bg-white px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-300 focus:border-bordo-700 focus:outline-none"
								/>
								<input
									type="number"
									placeholder="Max"
									value={(filterValue as [number?, number?])?.[1] ?? ""}
									onChange={(e) => {
										const max =
											e.target.value === ""
												? undefined
												: Number(e.target.value);
										const current = (filterValue as [number?, number?]) ?? [
											undefined,
											undefined,
										];
										column.setFilterValue([current[0], max]);
									}}
									className="w-full rounded border border-chumbo-100 bg-white px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-300 focus:border-bordo-700 focus:outline-none"
								/>
							</div>
						)}
						{hasFilter && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									column.setFilterValue(undefined);
									close();
								}}
								className="mt-2 w-full rounded bg-chumbo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-chumbo-700 hover:bg-chumbo-100/70"
							>
								Limpar filtro
							</button>
						)}
					</div>,
					document.body,
				)
			: null;

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				onClick={(e) => {
					e.stopPropagation();
					setOpen((v) => !v);
				}}
				className={cn(
					"rounded p-1 transition-colors hover:bg-chumbo-100",
					hasFilter && "text-bordo-700",
					!hasFilter && "text-chumbo-500",
				)}
				title="Filtrar coluna"
			>
				<FunnelIcon active={hasFilter} />
			</button>
			{panel}
		</>
	);
}

function FunnelIcon({ active }: { active: boolean }) {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5L2 3z"
				stroke="currentColor"
				strokeWidth="1.4"
				strokeLinejoin="round"
				fill={active ? "currentColor" : "none"}
			/>
		</svg>
	);
}

/**
 * Filter functions reutilizáveis pra colunas com tipos comuns.
 */
export const tableFilters = {
	/** Comparação contains case-insensitive. Use em colunas string. */
	textIncludes: <T,>(
		row: Row<T>,
		columnId: string,
		filterValue: unknown,
	): boolean => {
		if (filterValue == null || filterValue === "") return true;
		const cellValue = row.getValue(columnId);
		if (cellValue == null) return false;
		return String(cellValue)
			.toLowerCase()
			.includes(String(filterValue).toLowerCase());
	},
	/** Match exato (string). Use em filtros select. */
	exactMatch: <T,>(
		row: Row<T>,
		columnId: string,
		filterValue: unknown,
	): boolean => {
		if (filterValue == null || filterValue === "") return true;
		return String(row.getValue(columnId)) === String(filterValue);
	},
	/** Faixa de números [min, max] inclusiva. */
	numberRange: <T,>(
		row: Row<T>,
		columnId: string,
		filterValue: unknown,
	): boolean => {
		const range = filterValue as [number?, number?] | undefined;
		if (!range) return true;
		const [min, max] = range;
		const v = row.getValue(columnId) as number;
		if (min != null && v < min) return false;
		if (max != null && v > max) return false;
		return true;
	},
};
