/*
 * Tipos del modelo de datos de circuitos.
 * Reflejan la estructura canónica de /datos/circuitos.json.
 */

export type Topologia = 'voltage_divider' | 'emitter_bias' | 'collector_feedback'

/** Mapa de nombres de componente a su valor (ohmios, voltios, faradios o β). */
export type Componentes = Record<string, number>

/** Una ecuación simbólica con su sustitución y resultado de referencia. */
export interface Ecuacion {
  lhs: string
  rhs: string
  subst: string
  val: string
}

/** Un circuito (preset) tal y como aparece en el JSON canónico. */
export interface Circuito {
  id: string
  nombre: string
  topologia: Topologia
  re_bypass: boolean
  subtitulo: string
  componentes: Componentes
  ajustables: string[]
  dc: Record<string, number>
  ac: Record<string, number>
  ecuaciones_dc: Ecuacion[]
  ecuaciones_ac: Ecuacion[]
  nota: string
}

export interface MetaCircuitos {
  titulo: string
  supuestos: string
  VBE: number
  VT: number
  fuente: string
}

export interface DatosCircuitos {
  meta: MetaCircuitos
  circuitos: Circuito[]
}
