/*
 * OndaSenal.tsx — Senoide de entrada vs. salida; la salida se invierte 180°
 * cuando Av < 0 y su amplitud se escala con |Av| (recortada al alto del panel).
 * Adaptado de video/src/components/SignalWave.tsx.
 */
import { interpolate, useCurrentFrame } from 'remotion'
import { FONT_STACK, MONO_STACK, type PaletaAnimacion } from '../tema'

interface Props {
  Av: number // ganancia con signo: negativa => inversión de fase
  inicioFrame: number
  duracionTrazo: number
  acento: string
  paleta: PaletaAnimacion
  ancho?: number
}

const H = 188
const PAD_L = 56
const PAD_R = 24
const MID = H / 2

/** Genera el atributo "d" de un trazo senoidal recortado hasta progreso (0..1). */
function trazoSeno(
  amplitud: number,
  ciclos: number,
  invertida: boolean,
  progreso: number,
  faseAnim: number,
  plotW: number,
): string {
  const puntos: string[] = []
  const totales = 140
  const visibles = Math.max(2, Math.floor(totales * progreso))
  for (let i = 0; i < visibles; i++) {
    const t = i / (totales - 1)
    const x = PAD_L + t * plotW
    const ang = t * ciclos * Math.PI * 2 + faseAnim
    const signo = invertida ? -1 : 1
    const y = MID - signo * amplitud * Math.sin(ang)
    puntos.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return puntos.join(' ')
}

export function OndaSenal({
  Av,
  inicioFrame,
  duracionTrazo,
  acento,
  paleta,
  ancho = 520,
}: Props) {
  const W = ancho
  const PLOT_W = W - PAD_L - PAD_R
  const frame = useCurrentFrame()
  const local = frame - inicioFrame

  const dibujo = interpolate(local, [0, duracionTrazo], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const faseAnim = local * 0.06

  const ampEntrada = 22
  const tope = MID - 30
  const ampSalidaCruda = ampEntrada * Math.min(Math.abs(Av), 60)
  const ampSalida = Math.min(ampSalidaCruda, tope)
  const recortada = ampSalidaCruda > tope

  const invertida = Av < 0

  const dEntrada = trazoSeno(ampEntrada, 3, false, dibujo, faseAnim, PLOT_W)
  const dSalida = trazoSeno(ampSalida, 3, invertida, dibujo, faseAnim, PLOT_W)

  const opacidadNota = interpolate(
    local,
    [duracionTrazo * 0.6, duracionTrazo],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  return (
    <div style={{ width: W }}>
      <div
        style={{
          fontFamily: FONT_STACK,
          color: paleta.textDim,
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 5,
          letterSpacing: 0.3,
        }}
      >
        Señal: entrada vs. salida
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          border: `1px solid ${paleta.panelBorder}`,
        }}
      >
        <line
          x1={PAD_L}
          y1={MID}
          x2={W - PAD_R}
          y2={MID}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
        />
        <text x={14} y={MID + 5} fill={paleta.textDim} fontSize={18} fontFamily={MONO_STACK}>
          0V
        </text>
        {/* salida (detrás, amplitud grande) */}
        <path d={dSalida} fill="none" stroke={paleta.wireOut} strokeWidth={4} strokeLinecap="round" opacity={0.95} />
        {/* entrada (delante, amplitud pequeña) */}
        <path d={dEntrada} fill="none" stroke={acento} strokeWidth={4} strokeLinecap="round" />
      </svg>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 8,
          fontFamily: FONT_STACK,
          fontSize: 18,
          opacity: opacidadNota,
        }}
      >
        <span style={{ color: acento, fontWeight: 700 }}>● Entrada (vi)</span>
        <span style={{ color: paleta.wireOut, fontWeight: 700 }}>
          ● Salida (vo) ×{Math.abs(Av) >= 100 ? Math.abs(Av).toFixed(0) : Math.abs(Av).toFixed(1)}
        </span>
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: FONT_STACK,
          fontSize: 19,
          color: invertida ? paleta.warn : paleta.green,
          fontWeight: 700,
          opacity: opacidadNota,
        }}
      >
        {invertida ? '↺ Inversión de fase 180° (Av < 0)' : 'En fase (Av > 0)'}
        {recortada ? '  ·  amplitud a escala' : ''}
      </div>
    </div>
  )
}
