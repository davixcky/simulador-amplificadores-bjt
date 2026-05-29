/*
 * subindices.tsx — Renderiza "X_Y" como X con subíndice <sub>Y</sub>, de forma
 * segura para React (sin dangerouslySetInnerHTML).
 *
 * Regex EXACTA del requisito (NO incluye '+' en la clase de caracteres):
 *   /([A-Za-zβ∞])_([A-Za-z0-9]+)/g
 */
import { type ReactNode } from 'react'

const RE_SUB = /([A-Za-zβ∞])_([A-Za-z0-9]+)/g

/** Convierte un texto con notación "X_Y" en un array de nodos React con <sub>. */
// eslint-disable-next-line react-refresh/only-export-components
export function aSubindices(texto: string): ReactNode[] {
  const nodos: ReactNode[] = []
  let ultimo = 0
  let m: RegExpExecArray | null
  // Nueva instancia para no compartir lastIndex entre llamadas concurrentes.
  const re = new RegExp(RE_SUB.source, 'g')
  let clave = 0
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) nodos.push(texto.slice(ultimo, m.index))
    nodos.push(
      <span key={clave++}>
        {m[1]}
        <sub>{m[2]}</sub>
      </span>,
    )
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) nodos.push(texto.slice(ultimo))
  return nodos
}

/** Componente cómodo: <Sub>{"V_CE = V_CC − ..."}</Sub>. */
export function Sub({ children }: { children: string }) {
  return <>{aSubindices(children)}</>
}
