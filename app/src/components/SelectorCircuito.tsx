/*
 * SelectorCircuito.tsx — Pestañas para elegir uno de los 3 circuitos.
 */
import type { Circuito } from '../types/circuitos'

interface Props {
  circuitos: Circuito[]
  seleccionado: string
  onSeleccionar: (id: string) => void
}

export default function SelectorCircuito({ circuitos, seleccionado, onSeleccionar }: Props) {
  return (
    <nav
      className="selector-circuito"
      aria-label="Selección de circuito"
      role="tablist"
    >
      {circuitos.map((circ) => (
        <button
          key={circ.id}
          className="pestania"
          type="button"
          role="tab"
          aria-selected={circ.id === seleccionado}
          onClick={() => onSeleccionar(circ.id)}
        >
          <span className="nombre">{circ.nombre}</span>
          <span className="topo">{circ.subtitulo}</span>
        </button>
      ))}
    </nav>
  )
}
