/*
 * tema.ts — Paleta de la animación Remotion, derivada del tema claro/oscuro
 * de la app. Se pasa por inputProps al <Player> para que el lienzo combine con
 * el resto de la interfaz. Tipografías del sistema (sin recursos de red).
 */
import type { Tema } from '../lib/tema'

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const MONO_STACK =
  "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, monospace"

/** Colores que usa la composición. */
export interface PaletaAnimacion {
  bg: string
  bgAlt: string
  panel: string
  panelBorder: string
  text: string
  textDim: string
  accent: string
  wireOut: string
  warn: string
  green: string
}

/** Acento por circuito (igual que el proyecto de vídeo standalone). */
export const ACENTOS_CIRCUITO: Record<string, string> = {
  c1: '#5eead4', // teal — realimentación de colector
  c2: '#818cf8', // índigo — divisor de voltaje
  c3: '#f0abfc', // fucsia — polarización de emisor
}

/** Devuelve la paleta de la animación según el tema activo de la app. */
export function paletaSegunTema(tema: Tema): PaletaAnimacion {
  if (tema === 'oscuro') {
    return {
      bg: '#0b1020',
      bgAlt: '#10172e',
      panel: 'rgba(255,255,255,0.05)',
      panelBorder: 'rgba(255,255,255,0.12)',
      text: '#f4f7ff',
      textDim: '#aab4d4',
      accent: '#5eead4',
      wireOut: '#fb7185',
      warn: '#fbbf24',
      green: '#4ade80',
    }
  }
  // Tema claro: fondo oscuro suave que sigue contrastando bien con los
  // colores de acento, pero más luminoso que el modo oscuro.
  return {
    bg: '#1b2238',
    bgAlt: '#222b46',
    panel: 'rgba(255,255,255,0.06)',
    panelBorder: 'rgba(255,255,255,0.16)',
    text: '#f4f7ff',
    textDim: '#c2cbe4',
    accent: '#34d399',
    wireOut: '#f43f5e',
    warn: '#f59e0b',
    green: '#22c55e',
  }
}

export const acentoDeCircuito = (id: string, fallback: string): string =>
  ACENTOS_CIRCUITO[id] ?? fallback
