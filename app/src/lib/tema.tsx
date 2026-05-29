/*
 * tema.tsx — Contexto de tema claro/oscuro.
 * Prioridad inicial: ?tema=claro|oscuro (URL) > localStorage > prefers-color-scheme.
 * Persiste en localStorage y aplica data-tema en <html>.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Tema = 'claro' | 'oscuro'

const CLAVE_LS = 'bjt-tema'

interface ContextoTema {
  tema: Tema
  alternarTema: () => void
}

const TemaContext = createContext<ContextoTema | null>(null)

/** Calcula el tema inicial siguiendo la prioridad URL > localStorage > SO. */
function temaInicial(): Tema {
  let forzado: Tema | null = null
  try {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('tema')
    if (q === 'oscuro' || q === 'claro') forzado = q
  } catch {
    /* entornos sin URL: se ignora */
  }

  let guardado: string | null = null
  try {
    guardado = localStorage.getItem(CLAVE_LS)
  } catch {
    /* localStorage no disponible */
  }

  if (forzado) return forzado
  if (guardado === 'oscuro' || guardado === 'claro') return guardado
  const prefiereOscuro =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefiereOscuro ? 'oscuro' : 'claro'
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  // Aplica el atributo data-tema en <html> y persiste el valor.
  useEffect(() => {
    document.documentElement.setAttribute('data-tema', tema)
    try {
      localStorage.setItem(CLAVE_LS, tema)
    } catch {
      /* localStorage no disponible */
    }
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))
  }, [])

  return <TemaContext.Provider value={{ tema, alternarTema }}>{children}</TemaContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema(): ContextoTema {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema debe usarse dentro de <ProveedorTema>')
  return ctx
}
