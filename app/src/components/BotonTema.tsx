/*
 * BotonTema.tsx — Botón conmutador de tema claro/oscuro.
 * El icono (sol/luna) se dibuja con CSS según data-tema en <html>.
 */
import { useTema } from '../lib/tema'

export default function BotonTema() {
  const { alternarTema } = useTema()
  return (
    <button
      className="btn-tema"
      type="button"
      aria-label="Cambiar tema claro u oscuro"
      title="Cambiar tema"
      onClick={alternarTema}
    >
      <span className="icono-tema" aria-hidden="true" />
    </button>
  )
}
