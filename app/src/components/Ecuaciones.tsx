/*
 * Ecuaciones.tsx — Plantilla simbólica del JSON + sustitución numérica EN VIVO.
 * Símbolo + sustitución + resultado, con subíndices.
 */
import type { Config, Resultado } from '../lib/engine'
import { operadorRel, sustitucionViva } from '../lib/ecuaciones'
import { Sub } from '../lib/subindices'
import type { Ecuacion } from '../types/circuitos'

interface ListaProps {
  titulo: string
  lista: Ecuacion[]
  config: Config
  res: Resultado
}

function ListaEcuaciones({ titulo, lista, config, res }: ListaProps) {
  return (
    <div className="ecuaciones-bloque">
      <h3 className="ecuaciones-titulo">{titulo}</h3>
      <div className="ecuaciones">
        {lista.map((eq) => {
          const s = sustitucionViva(eq.lhs, config, res) // recalculado en vivo
          const op = operadorRel(eq.rhs)
          return (
            <div className="ecuacion" key={eq.lhs}>
              <span className="simbolica">
                <span className="lhs">
                  <Sub>{eq.lhs}</Sub>
                </span>{' '}
                {op.rel} <Sub>{op.rhs}</Sub>
              </span>
              <span className="sustitucion">
                {s.subst} = <span className="resultado">{s.val}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  ecuacionesDC: Ecuacion[]
  ecuacionesAC: Ecuacion[]
  config: Config
  res: Resultado
}

export default function Ecuaciones({ ecuacionesDC, ecuacionesAC, config, res }: Props) {
  return (
    <article className="tarjeta">
      <span className="micro-cabecera">Ecuaciones · sustitución en vivo</span>
      <h2 className="tarjeta-titulo">Ecuaciones</h2>
      <ListaEcuaciones titulo="Análisis DC" lista={ecuacionesDC} config={config} res={res} />
      <ListaEcuaciones titulo="Análisis AC" lista={ecuacionesAC} config={config} res={res} />
    </article>
  )
}
