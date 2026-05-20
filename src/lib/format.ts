const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const formatBRL = (n: number) => BRL.format(n);

/**
 * Formata valor monetário com sufixo K / Mi quando a magnitude justifica.
 * Escala igual ao Power BI — legível em cards e tabelas com colunas apertadas.
 *
 *   ≥ 1 000 000  →  R$ 1,23 Mi
 *   ≥ 1 000      →  R$ 1,23 K
 *   < 1 000      →  R$ 123,45   (sem sufixo)
 *
 * Mantém 2 casas decimais para K/Mi e usa locale pt-BR.
 */
export function formatBRLK(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${sign}R$ ${v} Mi`;
  }
  if (abs >= 1_000) {
    const v = (abs / 1_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    return `${sign}R$ ${v} K`;
  }
  return BRL.format(n);
}
/**
 * Variante de formatBRLK que NUNCA cai em valores raw — força K (ou Mi) mesmo para
 * valores menores que 1 000. Útil em colunas de tabela onde a escala precisa ser
 * consistente entre linhas (R$ 412 K convive com R$ 0,9 K, não com R$ 900,00).
 */
export function formatBRLKForced(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
    return `${sign}R$ ${v} Mi`;
  }
  const v = (abs / 1_000).toLocaleString("pt-BR", {
    minimumFractionDigits: abs < 1_000 ? 1 : 0,
    maximumFractionDigits: 1,
  });
  return `${sign}R$ ${v} K`;
}

export const formatNumber = (n: number) => NUM.format(n);
export const formatInt = (n: number) => INT.format(n);

/** Percentual a partir de fração (0.125 → "12,5%"). */
export const formatPercent = (frac: number) => PCT.format(frac);

/** Percentual a partir de valor já multiplicado por 100 (12.5 → "12,5%"). */
export const formatPercentValue = (val: number) => PCT.format(val / 100);

export function formatDelta(
  curr: number,
  prev: number,
): {
  abs: number;
  rel: number;
  label: string;
  sign: "up" | "down" | "flat";
} {
  const abs = curr - prev;
  const rel = prev === 0 ? 0 : abs / Math.abs(prev);
  const sign = abs > 0.0001 ? "up" : abs < -0.0001 ? "down" : "flat";
  const arrow = sign === "up" ? "▲" : sign === "down" ? "▼" : "·";
  return { abs, rel, sign, label: `${arrow} ${PCT.format(Math.abs(rel))}` };
}

const MESES_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const MESES_ABREV = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/**
 * Default do filtro De/Até nas análises de Performance.
 *   - De  = 1º janeiro do ano atual (YTD)
 *   - Até = mês anterior ao atual (último fechado), respeitando dados disponíveis
 *
 * Os dois resultados são limitados ao intervalo `meses[]` (sintetiza com o
 * primeiro/último mês disponível se cair fora).
 */
export function defaultIntervalo(meses: string[]): { start: string; end: string } {
  if (meses.length === 0) return { start: "", end: "" };
  const last = meses[meses.length - 1] as string;
  // end = mês mais recente disponível (mesmos dados que getLatestMonth(), mantém consistência entre páginas)
  const end = last;
  const ano = end.slice(0, 4);
  const startCandidate = `${ano}-01`;
  const first = meses[0] as string;
  const start = startCandidate < first ? first : startCandidate > last ? last : startCandidate;
  return { start: start > end ? end : start, end };
}

/** "2026-04" → "abril de 2026" */
export function formatMonthLong(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `${MESES_PT[m - 1]} de ${y}`;
}

/** "2026-04" → "abr/26" */
export function formatMonthShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `${MESES_ABREV[m - 1]}/${String(y).slice(-2)}`;
}

/** Date → "12/05/2026" */
export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

/** "2030-07-12" → "12/07/2030" — sem timezone shift. Devolve a string original se não parsear. */
export function formatISODateBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
