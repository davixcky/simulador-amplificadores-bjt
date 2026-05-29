import circuitosJson from "./circuitos.json";

export type Ecuacion = {
  lhs: string;
  rhs: string;
  subst: string;
  val: string;
};

export type Circuito = {
  id: string;
  nombre: string;
  topologia: string;
  re_bypass: boolean;
  subtitulo: string;
  componentes: Record<string, number>;
  ajustables: string[];
  dc: {
    IB: number;
    IC: number;
    IE: number;
    re: number;
    VCE: number;
    VB?: number;
    VE?: number;
  };
  ac: {
    Av: number;
    Av_simple?: number;
    Zi: number;
    Zi_simple?: number;
    Zo: number;
    betaRe?: number;
    Zb?: number;
  };
  ecuaciones_dc: Ecuacion[];
  ecuaciones_ac: Ecuacion[];
  nota: string;
};

export type CircuitosData = {
  meta: {
    titulo: string;
    supuestos: string;
    VBE: number;
    VT: number;
    fuente: string;
  };
  circuitos: Circuito[];
};

export const DATA = circuitosJson as unknown as CircuitosData;
export const CIRCUITOS = DATA.circuitos;

// --- Formateo de magnitudes a texto legible en espanol -------------------

export function fmtCorriente(a: number): string {
  // amperios -> mA / uA
  const mA = a * 1e3;
  if (Math.abs(mA) >= 1) return `${mA.toFixed(2)} mA`;
  return `${(a * 1e6).toFixed(1)} µA`;
}

export function fmtVolt(v: number): string {
  return `${v.toFixed(2)} V`;
}

export function fmtOhm(r: number): string {
  if (Math.abs(r) >= 1000) return `${(r / 1000).toFixed(2)} kΩ`;
  return `${r.toFixed(1)} Ω`;
}

export function fmtGanancia(av: number): string {
  // Una cifra decimal salvo que sea muy grande.
  if (Math.abs(av) >= 100) return av.toFixed(1);
  return av.toFixed(2);
}
