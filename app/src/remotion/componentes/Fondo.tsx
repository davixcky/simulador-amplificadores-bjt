/*
 * Fondo.tsx — Fondo con degradado radial según el acento y una rejilla sutil
 * en movimiento. Adaptado de video/src/components/Background.tsx.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import type { PaletaAnimacion } from '../tema'

interface Props {
  acento: string
  paleta: PaletaAnimacion
}

export function Fondo({ acento, paleta }: Props) {
  const frame = useCurrentFrame()
  const desplazamiento = (frame * 0.25) % 60
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 70% -10%, ${acento}22, transparent 60%), linear-gradient(160deg, ${paleta.bg} 0%, ${paleta.bgAlt} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          backgroundPosition: `${desplazamiento}px ${desplazamiento}px`,
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  )
}
