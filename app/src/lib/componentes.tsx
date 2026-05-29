/*
 * componentes.tsx — Metadatos de los componentes ajustables (rangos de slider,
 * conversión escala logarítmica y etiquetas). Portado desde /web/app.js.
 */
import { type ReactNode } from 'react'

export interface RangoComponente {
  min: number
  max: number
  log: boolean
  unidad: string
  paso: number
}

/** Devuelve {min,max,log,unidad,paso} para cada componente ajustable. */
export function rangoComponente(nombre: string, porDefecto: number): RangoComponente {
  if (nombre === 'beta') {
    return { min: 20, max: 400, log: false, unidad: '', paso: 1 }
  }
  if (nombre === 'VCC') {
    // Rango realista de alimentación.
    return { min: 3, max: 30, log: false, unidad: 'V', paso: 0.5 }
  }
  // Resistencias: escala logarítmica, ~0.1× .. 10× del valor por defecto.
  return { min: porDefecto * 0.1, max: porDefecto * 10, log: true, unidad: 'Ω', paso: 1 }
}

/** Valor mostrado en el campo numérico (resistencias enteras, β entero, VCC con decimal). */
export function valorCampo(nombre: string, v: number): number {
  if (nombre === 'beta') return Math.round(v)
  if (nombre === 'VCC') return Number(v.toFixed(1))
  return Math.round(v)
}

// Conversión escala logarítmica <-> posición de slider (0..1000).
export function valorAPosLog(v: number, r: RangoComponente): number {
  const t = (Math.log(v) - Math.log(r.min)) / (Math.log(r.max) - Math.log(r.min))
  return Math.round(Math.max(0, Math.min(1, t)) * 1000)
}

export function posLogAValor(pos: number, r: RangoComponente): number {
  const t = pos / 1000
  return Math.exp(Math.log(r.min) + t * (Math.log(r.max) - Math.log(r.min)))
}

/** Etiqueta legible con subíndice para cada componente (como nodos React). */
export function etiquetaComponente(nombre: string): ReactNode {
  if (nombre === 'beta') return 'β (ganancia de corriente)'
  if (nombre === 'VCC')
    return (
      <>
        V<sub>CC</sub> (alimentación)
      </>
    )
  // R1, R2, RC, RE, RB, RF -> el dígito/letra final como subíndice.
  const m = nombre.match(/^R(.+)$/)
  if (m)
    return (
      <>
        R<sub>{m[1]}</sub>
      </>
    )
  return nombre
}

/** Texto plano de la etiqueta (para aria-label, sin formato). */
export function etiquetaTexto(nombre: string): string {
  if (nombre === 'beta') return 'β (ganancia de corriente)'
  if (nombre === 'VCC') return 'VCC (alimentación)'
  return nombre
}
