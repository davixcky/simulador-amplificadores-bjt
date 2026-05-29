/*
 * BotonTema.tsx — Botón conmutador de tema claro/oscuro.
 * Icono sol/luna dibujado con SVG inline (currentColor) para un render nítido y
 * consistente en cualquier plataforma; antes se usaban glifos Unicode (☀/☾) que
 * el sistema renderizaba de forma ambigua (parecían engranaje / spinner).
 */
import { useTema } from '../lib/tema'

export default function BotonTema() {
  const { tema, alternarTema } = useTema()
  const esOscuro = tema === 'oscuro'
  return (
    <button
      className="btn-tema"
      type="button"
      aria-label={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title="Cambiar tema"
      onClick={alternarTema}
    >
      {esOscuro ? (
        // Luna (visible en tema oscuro): conmuta a claro.
        <svg
          className="icono-tema"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        // Sol (visible en tema claro): conmuta a oscuro.
        <svg
          className="icono-tema"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  )
}
