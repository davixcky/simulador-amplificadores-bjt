/*
 * ecuaciones.ts — Sustitución numérica EN VIVO de las ecuaciones simbólicas.
 * Portado desde /web/app.js (sustitucionViva, operadorRel).
 */
import { VBE } from './engine'
import type { Config, Resultado } from './engine'
import { fmtCompacto, fmtCorriente, fmtOhm, fmtTension, redondea } from './formato'

export interface Sustitucion {
  subst: string
  val: string
}

/**
 * Separa un operador relacional (≈, ≤, ≥, <, >) al inicio de rhs para no
 * duplicar el '=' (p. ej. "I_C = ≈ I_E" → "I_C ≈ I_E").
 */
export function operadorRel(rhs: string): { rel: string; rhs: string } {
  const r = String(rhs).trim()
  const syms = ['≈', '≤', '≥', '<', '>']
  for (let i = 0; i < syms.length; i++) {
    if (r.indexOf(syms[i]) === 0) return { rel: syms[i], rhs: r.slice(syms[i].length).trim() }
  }
  return { rel: '=', rhs: r }
}

/** Recalcula la sustitución numérica y el resultado EN VIVO según lhs. */
export function sustitucionViva(lhs: string, c: Config, res: Resultado): Sustitucion {
  const dc = res.dc,
    ac = res.ac
  const topo = c.topologia
  const f = fmtCompacto
  const VCC = c.VCC!,
    beta = c.beta!

  switch (lhs) {
    case 'V_B':
      return {
        subst: '(' + f(VCC) + '·' + f(c.R2!) + ') / (' + f(c.R1!) + ' + ' + f(c.R2!) + ')',
        val: fmtTension(dc.VB!),
      }
    case 'V_E':
      if (topo === 'voltage_divider')
        return { subst: f(dc.VB!) + ' − ' + VBE, val: fmtTension(dc.VE!) }
      break
    case 'I_B':
      if (topo === 'collector_feedback')
        return {
          subst:
            '(' +
            f(VCC) +
            ' − ' +
            VBE +
            ') / (' +
            f(c.RF!) +
            ' + ' +
            f(beta) +
            '·(' +
            f(c.RC!) +
            ' + ' +
            f(c.RE!) +
            '))',
          val: fmtCorriente(dc.IB),
        }
      if (topo === 'emitter_bias')
        return {
          subst:
            '(' +
            f(VCC) +
            ' − ' +
            VBE +
            ') / (' +
            f(c.RB!) +
            ' + ' +
            f(beta + 1) +
            '·' +
            f(c.RE!) +
            ')',
          val: fmtCorriente(dc.IB),
        }
      break
    case 'I_C':
      if (topo === 'voltage_divider') return { subst: '≈ I_E', val: fmtCorriente(dc.IC) }
      return { subst: f(beta) + ' · ' + fmtCorriente(dc.IB), val: fmtCorriente(dc.IC) }
    case 'I_E':
      if (topo === 'voltage_divider')
        return { subst: fmtTension(dc.VE!) + ' / ' + f(c.RE!), val: fmtCorriente(dc.IE) }
      return { subst: f(beta + 1) + ' · ' + fmtCorriente(dc.IB), val: fmtCorriente(dc.IE) }
    case 'r_e':
      return { subst: '26m / ' + fmtCorriente(dc.IE), val: fmtOhm(dc.re) }
    case 'V_CE':
      if (topo === 'voltage_divider')
        return {
          subst: f(VCC) + ' − ' + fmtCorriente(dc.IC) + '·' + f(c.RC! + c.RE!),
          val: fmtTension(dc.VCE),
        }
      return {
        subst: f(VCC) + ' − ' + fmtTension(dc.IC * c.RC!) + ' − ' + fmtTension(dc.IE * c.RE!),
        val: fmtTension(dc.VCE),
      }
    case 'A_v':
      if (topo === 'collector_feedback')
        return {
          subst: '−' + f(c.RC!) + ' / (' + f(dc.re) + ' + ' + f(c.RE!) + ')',
          val: redondea(ac.Av),
        }
      return { subst: '−' + f(c.RC!) + ' / ' + f(dc.re), val: redondea(ac.Av) }
    case 'Z_i':
      if (topo === 'voltage_divider')
        return {
          subst: f(c.R1!) + ' ∥ ' + f(c.R2!) + ' ∥ ' + f(ac.betaRe),
          val: fmtOhm(ac.Zi),
        }
      if (topo === 'emitter_bias')
        return { subst: f(c.RB!) + ' ∥ ' + f(ac.betaRe), val: fmtOhm(ac.Zi) }
      if (topo === 'collector_feedback')
        return { subst: f(ac.Zb!) + ' ∥ ' + f(c.RF!) + '/(1−A_v)', val: fmtOhm(ac.Zi) }
      break
    case 'Z_o':
      if (topo === 'collector_feedback')
        return { subst: f(c.RC!) + ' ∥ ' + f(c.RF!), val: fmtOhm(ac.Zo) }
      return { subst: f(c.RC!), val: fmtOhm(ac.Zo) }
  }
  // Fallback genérico (no debería alcanzarse).
  return { subst: '—', val: '—' }
}
