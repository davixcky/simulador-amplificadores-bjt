/*
 * engine.ts — Motor de cálculo de amplificadores BJT (modelo r_e, ro = ∞)
 * Portado EXACTO desde /web/engine.js. NO modificar la matemática.
 *
 * Supuestos: VBE = 0.7 V, VT = 26 mV, ro = ∞.
 * Topologías: voltage_divider, emitter_bias, collector_feedback.
 * Todas las resistencias en ohmios, tensiones en voltios, corrientes en amperios.
 */
import type { Topologia } from '../types/circuitos'

export const VBE = 0.7
export const VT = 0.026

/** Configuración de entrada para solve(). Las claves de resistencia son opcionales
 *  porque cada topología usa un subconjunto distinto. */
export interface Config {
  topologia: Topologia
  VCC: number
  beta: number
  R1?: number
  R2?: number
  RC?: number
  RE?: number
  RB?: number
  RF?: number
  // Permite indexar por nombre de componente (R1, R2, ...).
  [clave: string]: number | Topologia | undefined
}

export interface ResultadoDC {
  VB?: number
  VE?: number
  IB: number
  IC: number
  IE: number
  re: number
  VCE: number
  metodo?: string
}

export interface ResultadoAC {
  Av: number
  Zi: number
  Zo: number
  betaRe: number
  AvSimple?: number
  ZiSimple?: number
  Zb?: number
}

export interface CheckDivisor {
  betaRE: number
  diezR2: number
  aproxValido: boolean
}

export interface Resultado {
  dc: ResultadoDC
  ac: ResultadoAC
  check?: CheckDivisor
  topologia?: Topologia
}

/** Paralelo de dos resistencias. */
export function par(a: number, b: number): number {
  return (a * b) / (a + b)
}

// --- Divisor de voltaje, RE desacoplado en AC ---------------------------
function voltageDivider(c: Config): Resultado {
  const VCC = c.VCC!,
    R1 = c.R1!,
    R2 = c.R2!,
    RC = c.RC!,
    RE = c.RE!,
    beta = c.beta!
  const betaRE = beta * RE,
    R10R2 = 10 * R2
  const aprox = betaRE >= R10R2
  let VB: number, IB: number, IC: number, IE: number, metodo: string
  if (aprox) {
    VB = (VCC * R2) / (R1 + R2)
    const VE = VB - VBE
    IE = VE / RE
    IC = IE
    IB = IC / beta
    metodo = 'aproximado'
  } else {
    // Thévenin exacto
    const Rth = par(R1, R2),
      Vth = (VCC * R2) / (R1 + R2)
    IB = (Vth - VBE) / (Rth + (beta + 1) * RE)
    IC = beta * IB
    IE = (beta + 1) * IB
    VB = Vth - IB * Rth
    metodo = 'exacto (Thévenin)'
  }
  const VE2 = VB - VBE
  const re = VT / IE
  const VCE = VCC - IC * (RC + RE)
  const betaRe = beta * re
  const Zi = 1 / (1 / R1 + 1 / R2 + 1 / betaRe)
  return {
    dc: { VB: VB, VE: VE2, IB: IB, IC: IC, IE: IE, re: re, VCE: VCE, metodo: metodo },
    ac: { Av: -RC / re, Zi: Zi, Zo: RC, betaRe: betaRe },
    check: { betaRE: betaRE, diezR2: R10R2, aproxValido: aprox },
  }
}

// --- Polarización por RB única (emitter-bias), RE desacoplado en AC -----
function emitterBias(c: Config): Resultado {
  const VCC = c.VCC!,
    RB = c.RB!,
    RC = c.RC!,
    RE = c.RE!,
    beta = c.beta!
  const IB = (VCC - VBE) / (RB + (beta + 1) * RE)
  const IC = beta * IB,
    IE = (beta + 1) * IB
  const re = VT / IE
  const VCE = VCC - IC * RC - IE * RE
  const betaRe = beta * re
  const Zi = par(RB, betaRe)
  return {
    dc: { IB: IB, IC: IC, IE: IE, re: re, VCE: VCE },
    ac: { Av: -RC / re, Zi: Zi, Zo: RC, betaRe: betaRe },
  }
}

// --- Realimentación de colector, RE SIN desacoplar ----------------------
function collectorFeedback(c: Config): Resultado {
  const VCC = c.VCC!,
    RF = c.RF!,
    RC = c.RC!,
    RE = c.RE!,
    beta = c.beta!
  const IB = (VCC - VBE) / (RF + beta * (RC + RE))
  const IC = beta * IB,
    IE = (beta + 1) * IB
  const re = VT / IE
  const VCE = VCC - IC * RC - IE * RE
  const Zb = beta * re + (beta + 1) * RE // impedancia mirando a la base
  // Solución nodal exacta (realimentación a través de RF):
  const Av = (1 / RF - beta / Zb) / (1 / RF + 1 / RC)
  const AvSimple = -RC / (re + RE) // aprox. de cálculo a mano
  const Zi = 1 / (1 / Zb + (1 - Av) / RF)
  const ZiSimple = 1 / (1 / Zb + (1 - AvSimple) / RF)
  const Zo = par(RC, RF)
  return {
    dc: { IB: IB, IC: IC, IE: IE, re: re, VCE: VCE },
    ac: { Av: Av, AvSimple: AvSimple, Zi: Zi, ZiSimple: ZiSimple, Zo: Zo, betaRe: beta * re, Zb: Zb },
  }
}

const TOPOS: Record<Topologia, (c: Config) => Resultado> = {
  voltage_divider: voltageDivider,
  emitter_bias: emitterBias,
  collector_feedback: collectorFeedback,
}

export function solve(c: Config): Resultado {
  const fn = TOPOS[c.topologia]
  if (!fn) throw new Error('Topología desconocida: ' + c.topologia)
  const r = fn(c)
  r.topologia = c.topologia
  return r
}

// Máxima excursión simétrica de salida (pico) para el dibujo de ondas.
// Limitada por VCE (saturación) y por la caída en RC (corte).
export function maxSwing(res: Resultado, c: Config): number {
  const VCE = res.dc.VCE,
    IC = res.dc.IC,
    RC = c.RC!
  const hastaSat = VCE // antes de saturar
  const hastaCorte = IC * RC // antes de cortar
  return Math.max(0, Math.min(hastaSat, hastaCorte))
}

const api = { solve, par, maxSwing, VBE, VT }
export default api
