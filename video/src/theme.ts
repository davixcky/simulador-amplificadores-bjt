// Paleta y constantes de estilo compartidas. Tipografia del sistema (sin red).
export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const MONO_STACK =
  "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, monospace";

export const COLORS = {
  bg: "#0b1020",
  bgAlt: "#10172e",
  panel: "rgba(255,255,255,0.05)",
  panelBorder: "rgba(255,255,255,0.12)",
  text: "#f4f7ff",
  textDim: "#aab4d4",
  accent: "#5eead4", // teal
  accent2: "#818cf8", // indigo
  warn: "#fbbf24", // amber
  danger: "#fb7185", // rose
  green: "#4ade80",
  wireIn: "#5eead4",
  wireOut: "#fb7185",
};

// Cada circuito tiene un acento distinto para distinguir las escenas.
export const CIRCUIT_ACCENTS: Record<string, string> = {
  c1: "#5eead4", // teal — realimentacion de colector
  c2: "#818cf8", // indigo — divisor de voltaje
  c3: "#f0abfc", // fucsia — polarizacion de emisor
};
