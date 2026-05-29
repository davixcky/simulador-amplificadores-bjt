/*
 * PanelDC.tsx — Punto de operación: VB/VE (si aplica), IB, IC, IE, re, VCE.
 * Incluye aviso de región de operación y aviso del método del divisor.
 */
import type { Resultado } from '../lib/engine'
import { fmtCorriente, fmtOhm, fmtTension } from '../lib/formato'
import { Sub } from '../lib/subindices'

interface Props {
  res: Resultado
  vcc: number
}

export default function PanelDC({ res, vcc }: Props) {
  const dc = res.dc
  const items: [string, string][] = []
  if (dc.VB !== undefined) items.push(['V_B', fmtTension(dc.VB)])
  if (dc.VE !== undefined) items.push(['V_E', fmtTension(dc.VE)])
  items.push(['I_B', fmtCorriente(dc.IB)])
  items.push(['I_C', fmtCorriente(dc.IC)])
  items.push(['I_E', fmtCorriente(dc.IE)])
  items.push(['r_e', fmtOhm(dc.re)])
  items.push(['V_CE', fmtTension(dc.VCE)])

  // Aviso de región de operación (saturación / corte / activa).
  let avisoEstado: { texto: string } | null = null
  if (dc.VCE < 0.3) {
    avisoEstado = {
      texto:
        '⚠ Transistor en SATURACIÓN (V_CE < 0.3 V): el amplificador no funciona linealmente.',
    }
  } else if (dc.IC <= 0 || dc.VCE >= vcc - 0.05) {
    avisoEstado = { texto: '⚠ Transistor cerca del CORTE: corriente de colector casi nula.' }
  }

  // Aviso del método del divisor de voltaje.
  let avisoMetodo: string | null = null
  if (res.check) {
    const ok = res.check.aproxValido
    avisoMetodo = ok
      ? 'Método aproximado del divisor VÁLIDO: β·RE = ' +
        fmtOhm(res.check.betaRE) +
        ' ≥ 10·R2 = ' +
        fmtOhm(res.check.diezR2) +
        ' (' +
        (dc.metodo || 'aproximado') +
        ').'
      : 'Método aproximado NO válido (β·RE = ' +
        fmtOhm(res.check.betaRE) +
        ' < 10·R2 = ' +
        fmtOhm(res.check.diezR2) +
        '): se usa solución ' +
        (dc.metodo || 'exacta') +
        '.'
  }

  return (
    <article className="tarjeta">
      <h2 className="tarjeta-titulo">Punto de operación (DC)</h2>
      {avisoEstado ? <div className="aviso aviso-peligro"><Sub>{avisoEstado.texto}</Sub></div> : null}
      {avisoMetodo ? <div className="aviso aviso-info">{avisoMetodo}</div> : null}
      <dl className="magnitudes">
        {items.map(([sim, val]) => (
          <div className="magnitud" key={sim}>
            <dt>
              <Sub>{sim}</Sub>
            </dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
