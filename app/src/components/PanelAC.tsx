/*
 * PanelAC.tsx — Ganancia e impedancias (Av con dB, Zi, Zo).
 * Para realimentación de colector muestra también Av aproximado y la nota.
 */
import { type ReactNode } from 'react'
import type { Resultado } from '../lib/engine'
import { fmtOhm, redondea } from '../lib/formato'
import { Sub } from '../lib/subindices'

interface Props {
  res: Resultado
}

export default function PanelAC({ res }: Props) {
  const ac = res.ac
  const dB = 20 * Math.log10(Math.abs(ac.Av))

  // clave: A_v es el resultado protagonista del panel AC; flashKey detecta el cambio.
  const items: { sim: string; valor: ReactNode; clave?: boolean; flashKey: string }[] = []
  items.push({
    sim: 'A_v',
    clave: true,
    flashKey: redondea(ac.Av),
    valor: (
      <>
        {redondea(ac.Av)}{' '}
        <span style={{ fontSize: '.8rem', color: 'var(--texto-tenue)' }}>
          ({isFinite(dB) ? redondea(dB) + ' dB' : '—'})
        </span>
      </>
    ),
  })
  items.push({ sim: 'Z_i', valor: fmtOhm(ac.Zi), flashKey: fmtOhm(ac.Zi) })
  items.push({ sim: 'Z_o', valor: fmtOhm(ac.Zo), flashKey: fmtOhm(ac.Zo) })
  // Realimentación de colector: muestra también el Av aproximado de cálculo a mano.
  if (ac.AvSimple !== undefined) {
    items.push({ sim: 'A_v (aprox.)', valor: redondea(ac.AvSimple), flashKey: redondea(ac.AvSimple) })
  }

  return (
    <article className="tarjeta">
      <span className="micro-cabecera">Análisis AC</span>
      <h2 className="tarjeta-titulo">
        Análisis AC (modelo r<sub>e</sub>)
      </h2>
      <dl className="magnitudes">
        {items.map((it) => (
          <div className={'magnitud' + (it.clave ? ' magnitud-clave' : '')} key={it.sim}>
            <dt>
              <Sub>{it.sim}</Sub>
            </dt>
            <dd className="magnitud-flash" key={it.flashKey}>
              {it.valor}
            </dd>
          </div>
        ))}
      </dl>
      {ac.AvSimple !== undefined ? (
        <p className="nota-ac">
          <Sub>
            {
              'La realimentación por R_F corrige la ganancia: el valor exacto (modelo nodal) difiere algo del cálculo aproximado −R_C/(r_e+R_E).'
            }
          </Sub>
        </p>
      ) : null}
    </article>
  )
}
