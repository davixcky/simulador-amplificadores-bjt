/*
 * TarjetaMetrica.tsx — Tarjeta de magnitud (DC/AC) con animación de entrada
 * (spring). Adaptado de video/src/components/MetricCard.tsx.
 */
import { spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT_STACK, MONO_STACK, type PaletaAnimacion } from '../tema'

interface Props {
  etiqueta: string
  valor: string
  sub?: string
  retardo: number
  acento: string
  paleta: PaletaAnimacion
  destacada?: boolean
}

export function TarjetaMetrica({
  etiqueta,
  valor,
  sub,
  retardo,
  acento,
  paleta,
  destacada,
}: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - retardo

  const entra = spring({
    frame: local,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 120 },
  })
  const opacidad = spring({ frame: local, fps, config: { damping: 200 } })
  const translateY = (1 - entra) * 36
  const escala = 0.9 + entra * 0.1

  return (
    <div
      style={{
        background: destacada ? 'rgba(255,255,255,0.10)' : paleta.panel,
        border: `1px solid ${destacada ? acento : paleta.panelBorder}`,
        borderRadius: 16,
        padding: '14px 18px',
        minWidth: 168,
        opacity: opacidad,
        transform: `translateY(${translateY}px) scale(${escala})`,
        boxShadow: destacada ? `0 0 26px ${acento}33` : 'none',
      }}
    >
      <div
        style={{
          fontFamily: FONT_STACK,
          color: paleta.textDim,
          fontSize: 19,
          fontWeight: 600,
          letterSpacing: 0.4,
        }}
      >
        {etiqueta}
      </div>
      <div
        style={{
          fontFamily: MONO_STACK,
          color: destacada ? acento : paleta.text,
          fontSize: 33,
          fontWeight: 800,
          lineHeight: 1.15,
          marginTop: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {valor}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: MONO_STACK,
            color: paleta.textDim,
            fontSize: 16,
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  )
}
