/** Paleta única de referência — DARK MODE.
 *  Espelha os tokens de `globals.css`. Sempre que possível, use a variável
 *  CSS via classes Tailwind; este objeto existe para gráficos (Recharts)
 *  que recebem cores como strings em props. */
export const colors = {
  bordo: {
    950: "#2a0d14",
    700: "#b8324a",
    600: "#c4405b",
    500: "#d8607a",
    50: "#3a1820",
  },
  chumbo: {
    // Escala invertida — 950 é texto claro, 100 é borda escura
    950: "#f0f2f5",
    800: "#d0d4d9",
    700: "#b0b6bd",
    500: "#7a8290",
    100: "#3d4852",
  },
  azul: "#4a7bb8",
  verde: "#4ba87a",
  offwhite: "#161b22",
  bege: "#242b35",
  surface: "#242b35",
  preto: "#0d0c0d",
  positive: "#4ba87a",
  negative: "#d8607a",
  warning: "#e09347",
  neutral: "#7a8290",
} as const;

/** Ordem fixa para séries categóricas em gráficos. */
export const categorical = [
  "#b8324a",
  "#4a7bb8",
  "#4ba87a",
  "#e09347",
  "#9aa3b0",
  "#d8607a",
  "#3d4852",
  "#9b2336",
] as const;
