/*
 * formato.ts — Utilidades de formato en unidades de ingeniería.
 * Portado desde /web/app.js (fmtOhm, fmtCorriente, fmtTension, redondea, fmtCompacto).
 */

/** Redondea a 3 cifras significativas para una lectura limpia. */
export function redondea(v: number): string {
  if (v === 0) return '0'
  if (!isFinite(v)) return '∞'
  const n = Number(v.toPrecision(3))
  return String(n)
}

/** Formatea una resistencia en Ω / kΩ / MΩ. */
export function fmtOhm(v: number): string {
  if (v >= 1e6) return redondea(v / 1e6) + ' MΩ'
  if (v >= 1e3) return redondea(v / 1e3) + ' kΩ'
  return redondea(v) + ' Ω'
}

/** Formatea una corriente en µA / mA / A. */
export function fmtCorriente(v: number): string {
  const a = Math.abs(v)
  if (a < 1e-3) return redondea(v * 1e6) + ' µA'
  if (a < 1) return redondea(v * 1e3) + ' mA'
  return redondea(v) + ' A'
}

/** Formatea una tensión en mV / V. */
export function fmtTension(v: number): string {
  if (Math.abs(v) < 1) return redondea(v * 1e3) + ' mV'
  return redondea(v) + ' V'
}

/** Formato compacto de un número para la sustitución de ecuaciones (kΩ/µ...). */
export function fmtCompacto(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e6) return redondea(v / 1e6) + 'M'
  if (a >= 1e3) return redondea(v / 1e3) + 'k'
  if (a >= 1) return redondea(v)
  if (a >= 1e-3) return redondea(v * 1e3) + 'm'
  if (a >= 1e-6) return redondea(v * 1e6) + 'µ'
  return redondea(v)
}
