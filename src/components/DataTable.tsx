"use client";

/**
 * DataTable — componente padrão de tabela de listagem do ContransBI.
 *
 * Padroniza (decisão arquitetural 18/05/2026 com Leonardo):
 *   - Sort por click no header (asc → desc → null), indicador ↑↓
 *   - Filtro por coluna via ícone de funil → popover (text | select | numberRange)
 *   - Altura limitada a ~10 linhas com header sticky + scrollbar
 *   - Counter no rodapé "X de Y registros (Z filtrados)"
 *   - Linha expansível inline (drill-down) opcional
 *
 * NÃO se aplica a: pivots (DRE, frota faturamento, armazem ocupacao),
 * heatmaps e grids declarativos (arquitetura).
 *
 * Motor: TanStack Table v8 (headless).
 */

import { cn } from "../lib/cn";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { type ReactNode, useMemo, useRef, useState } from "react";

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
  /** Linha expansível inline (drill-down). */
  expandable?: (row: T) => ReactNode;
  /** Limite de linhas visíveis. Default: 10. Acima disso vira scroll. */
  maxVisibleRows?: number;
  /** Altura aproximada de uma linha em px. Default: 44 (3rem). */
  estimatedRowHeight?: number;
  /** Mensagem quando não há dados. */
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  initialSort = [],
  expandable,
  maxVisibleRows = 10,
  estimatedRowHeight = 44,
  emptyMessage = "Sem registros para exibir.",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set());

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const filteredRows = table.getRowModel().rows;
  const totalRegistros = data.length;
  const totalFiltrados = filteredRows.length;
  const temScroll = totalFiltrados > maxVisibleRows;

  // Header sticky + body com scroll: usamos maxHeight calculado a partir de maxVisibleRows.
  // +1 linha pro header. Adicionamos 4px pra evitar corte na ultima linha.
  const maxHeight = (maxVisibleRows + 1) * estimatedRowHeight + 4;

  function toggleExpand(key: string | number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-chumbo-100 bg-bege">
      <div
        className={cn("relative", temScroll && "overflow-y-auto")}
        style={temScroll ? { maxHeight } : undefined}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-bege/95 backdrop-blur-sm">
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
                        "px-4 py-3 font-semibold",
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
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          disabled={!canSort}
                          className={cn(
                            "inline-flex items-center gap-1 transition-colors",
                            canSort && "cursor-pointer hover:text-chumbo-950",
                            !canSort && "cursor-default",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllColumns().length}
                  className="px-4 py-10 text-center text-xs italic text-chumbo-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
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
      <div className="border-t border-chumbo-100/40 bg-bege/30 px-4 py-2 text-[11px] text-chumbo-500">
        {totalFiltrados === totalRegistros ? (
          <>
            Mostrando <span className="tabular text-chumbo-700">{totalFiltrados}</span> registro
            {totalFiltrados === 1 ? "" : "s"}
          </>
        ) : (
          <>
            Mostrando <span className="tabular text-chumbo-700">{totalFiltrados}</span> de{" "}
            <span className="tabular text-chumbo-700">{totalRegistros}</span> registros
            <span className="ml-1 text-chumbo-500">(filtro ativo)</span>
          </>
        )}
        {temScroll && <span className="ml-2 text-chumbo-500">· role para ver mais</span>}
      </div>
    </div>
  );
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
          "border-b border-chumbo-100/40 transition-colors",
          clickable && "cursor-pointer hover:bg-bege/30",
          isExpanded && "bg-bege/40",
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
          <td colSpan={row.getVisibleCells().length} className="bg-bege/20 px-4 py-4">
            {expandable(row.original)}
          </td>
        </tr>
      )}
    </>
  );
}

function SortIndicator({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === false) {
    return <span className="text-chumbo-300 text-[10px]">↕</span>;
  }
  return (
    <span className="text-bordo-700 text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>
  );
}

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
  const ref = useRef<HTMLDivElement>(null);
  const filterValue = column.getFilterValue();
  const hasFilter = filterValue != null && filterValue !== "" &&
    !(Array.isArray(filterValue) && filterValue.every((v) => v == null || v === ""));

  // Para select: extrai valores únicos da coluna
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
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
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fechar filtro"
          />
          <div
            className={cn(
              "absolute top-7 z-30 min-w-[200px] rounded-md border border-chumbo-100 bg-bege p-2 shadow-xl",
              popoverAlign === "right" ? "right-0" : "left-0",
            )}
            style={{ colorScheme: "dark" }}
          >
            {type === "text" && (
              <input
                type="text"
                placeholder="Filtrar..."
                value={(filterValue as string) ?? ""}
                onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded border border-chumbo-100 bg-offwhite px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-500 focus:border-bordo-700 focus:outline-none"
                autoFocus
              />
            )}
            {type === "select" && (
              <select
                value={(filterValue as string) ?? ""}
                onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                onClick={(e) => e.stopPropagation()}
                className="w-full rounded border border-chumbo-100 bg-offwhite px-2 py-1 text-xs text-chumbo-950 focus:border-bordo-700 focus:outline-none"
                style={{ colorScheme: "dark" }}
                autoFocus
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
                    const min = e.target.value === "" ? undefined : Number(e.target.value);
                    const current = (filterValue as [number?, number?]) ?? [undefined, undefined];
                    column.setFilterValue([min, current[1]]);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded border border-chumbo-100 px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-500 focus:border-bordo-700 focus:outline-none"
                  style={{ backgroundColor: "#1b2028" }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={(filterValue as [number?, number?])?.[1] ?? ""}
                  onChange={(e) => {
                    const max = e.target.value === "" ? undefined : Number(e.target.value);
                    const current = (filterValue as [number?, number?]) ?? [undefined, undefined];
                    column.setFilterValue([current[0], max]);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full rounded border border-chumbo-100 px-2 py-1 text-xs text-chumbo-950 placeholder:text-chumbo-500 focus:border-bordo-700 focus:outline-none"
                  style={{ backgroundColor: "#1b2028" }}
                />
              </div>
            )}
            {hasFilter && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  column.setFilterValue(undefined);
                  setOpen(false);
                }}
                className="mt-2 w-full rounded bg-chumbo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-chumbo-700 hover:bg-chumbo-100/70"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function FunnelIcon({ active }: { active: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  textIncludes: <T,>(row: Row<T>, columnId: string, filterValue: unknown): boolean => {
    if (filterValue == null || filterValue === "") return true;
    const cellValue = row.getValue(columnId);
    if (cellValue == null) return false;
    return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
  },
  /** Match exato (string). Use em filtros select. */
  exactMatch: <T,>(row: Row<T>, columnId: string, filterValue: unknown): boolean => {
    if (filterValue == null || filterValue === "") return true;
    return String(row.getValue(columnId)) === String(filterValue);
  },
  /** Faixa de números [min, max] inclusiva. */
  numberRange: <T,>(row: Row<T>, columnId: string, filterValue: unknown): boolean => {
    const range = filterValue as [number?, number?] | undefined;
    if (!range) return true;
    const [min, max] = range;
    const v = row.getValue(columnId) as number;
    if (min != null && v < min) return false;
    if (max != null && v > max) return false;
    return true;
  },
};
