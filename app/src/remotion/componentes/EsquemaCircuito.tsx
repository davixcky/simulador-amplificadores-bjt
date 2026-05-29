/*
 * EsquemaCircuito.tsx — Esquema NPN dibujado en SVG con aparición animada
 * (spring) y un punto de corriente que recorre RC. Las etiquetas de las
 * resistencias muestran los VALORES ACTUALES del usuario (config), no fijos.
 * Adaptado de video/src/components/CircuitSchematic.tsx.
 */
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import type { Config } from '../../lib/engine'
import { fmtOhm } from '../../lib/formato'
import { MONO_STACK, type PaletaAnimacion } from '../tema'

interface Props {
  config: Config
  inicioFrame: number
  acento: string
  paleta: PaletaAnimacion
}

const W = 460
const H = 380

interface ResistenciaProps {
  x: number
  y: number
  largo: number
  horizontal?: boolean
  etiqueta: string
  valor: string
  aparece: number
  color: string
  paleta: PaletaAnimacion
}

/** Resistencia dibujada como zig-zag, vertical u horizontal. */
function Resistencia({
  x,
  y,
  largo,
  horizontal,
  etiqueta,
  valor,
  aparece,
  color,
  paleta,
}: ResistenciaProps) {
  const zig = 14
  const dientes = 6
  const seg = largo / (dientes + 2)
  const pts: string[] = []
  if (!horizontal) {
    pts.push(`${x},${y}`)
    pts.push(`${x},${y + seg}`)
    for (let i = 0; i < dientes; i++) {
      const yy = y + seg + (i + 0.5) * seg
      const xx = x + (i % 2 === 0 ? zig : -zig)
      pts.push(`${xx},${yy}`)
    }
    pts.push(`${x},${y + largo - seg}`)
    pts.push(`${x},${y + largo}`)
  } else {
    pts.push(`${x},${y}`)
    pts.push(`${x + seg},${y}`)
    for (let i = 0; i < dientes; i++) {
      const xx = x + seg + (i + 0.5) * seg
      const yy = y + (i % 2 === 0 ? zig : -zig)
      pts.push(`${xx},${yy}`)
    }
    pts.push(`${x + largo - seg},${y}`)
    pts.push(`${x + largo},${y}`)
  }
  return (
    <g opacity={aparece}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={paleta.text}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text
        x={horizontal ? x + largo / 2 : x + 22}
        y={horizontal ? y - 16 : y + largo / 2 - 4}
        fill={color}
        fontSize={20}
        fontFamily={MONO_STACK}
        fontWeight={700}
        textAnchor={horizontal ? 'middle' : 'start'}
      >
        {etiqueta}
      </text>
      <text
        x={horizontal ? x + largo / 2 : x + 22}
        y={horizontal ? y - 16 + 20 : y + largo / 2 + 16}
        fill={paleta.textDim}
        fontSize={16}
        fontFamily={MONO_STACK}
        textAnchor={horizontal ? 'middle' : 'start'}
      >
        {valor}
      </text>
    </g>
  )
}

export function EsquemaCircuito({ config, inicioFrame, acento, paleta }: Props) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const local = frame - inicioFrame

  const sp = (retardo: number) =>
    spring({ frame: local - retardo, fps, config: { damping: 200, mass: 0.8 } })

  const flujo = (local % 60) / 60

  const bx = 230
  const by = 190
  const barTop = by - 45
  const barBot = by + 45
  const baseX = bx - 60

  const transistor = sp(4)

  // Etiqueta y valor de RC y de la red de polarización según la topología.
  const rc = config.RC ?? 0
  const re = config.RE ?? 0
  const etiquetaPol = (() => {
    if (config.topologia === 'voltage_divider') return 'R1 / R2'
    if (config.topologia === 'emitter_bias') return 'RB'
    return 'RF'
  })()

  return (
    <svg width={W * 0.74} height={H * 0.74} viewBox={`0 0 ${W} ${H}`}>
      {/* Riel VCC superior */}
      <g opacity={sp(0)}>
        <line x1={90} y1={40} x2={400} y2={40} stroke={paleta.text} strokeWidth={3} strokeLinecap="round" />
        <text x={405} y={46} fill={acento} fontSize={20} fontFamily={MONO_STACK} fontWeight={700}>
          VCC
        </text>
      </g>

      {/* RC: del riel al colector */}
      <Resistencia
        x={bx + 30}
        y={50}
        largo={75}
        etiqueta="RC"
        valor={fmtOhm(rc)}
        aparece={sp(8)}
        color={acento}
        paleta={paleta}
      />
      <line x1={bx + 30} y1={40} x2={bx + 30} y2={50} stroke={paleta.text} strokeWidth={3} opacity={sp(8)} />
      <line x1={bx + 30} y1={125} x2={bx + 30} y2={barTop + 8} stroke={paleta.text} strokeWidth={3} opacity={sp(8)} />
      <line x1={bx + 30} y1={barTop + 8} x2={bx + 2} y2={barTop + 18} stroke={paleta.text} strokeWidth={3} opacity={transistor} />

      {/* Transistor NPN */}
      <g opacity={transistor}>
        <circle cx={bx} cy={by} r={62} fill="rgba(255,255,255,0.03)" stroke={acento} strokeWidth={2.5} />
        <line x1={bx - 2} y1={barTop} x2={bx - 2} y2={barBot} stroke={paleta.text} strokeWidth={5} />
        <line x1={baseX} y1={by} x2={bx - 2} y2={by} stroke={paleta.text} strokeWidth={3} />
        <line x1={bx - 2} y1={barTop + 16} x2={bx + 30} y2={barTop + 4} stroke={paleta.text} strokeWidth={3} />
        <line x1={bx - 2} y1={barBot - 16} x2={bx + 30} y2={barBot + 6} stroke={paleta.text} strokeWidth={3} />
        <polygon
          points={`${bx + 30},${barBot + 6} ${bx + 16},${barBot} ${bx + 18},${barBot + 14}`}
          fill={paleta.text}
        />
        <text x={bx + 36} y={barTop + 8} fill={paleta.textDim} fontSize={16} fontFamily={MONO_STACK}>C</text>
        <text x={baseX - 18} y={by - 8} fill={paleta.textDim} fontSize={16} fontFamily={MONO_STACK}>B</text>
        <text x={bx + 36} y={barBot + 16} fill={paleta.textDim} fontSize={16} fontFamily={MONO_STACK}>E</text>
      </g>

      {/* Red de polarización de base (etiqueta) */}
      <g opacity={sp(12)}>
        <line x1={120} y1={by} x2={baseX} y2={by} stroke={paleta.text} strokeWidth={3} />
        <circle cx={120} cy={by} r={5} fill={acento} />
        <text x={70} y={by - 14} fill={acento} fontSize={20} fontFamily={MONO_STACK} fontWeight={700}>
          {etiquetaPol}
        </text>
        <text x={70} y={by + 28} fill={paleta.textDim} fontSize={15} fontFamily={MONO_STACK}>
          base
        </text>
      </g>

      {/* RE: del emisor a tierra */}
      <line x1={bx + 30} y1={barBot + 6} x2={bx + 30} y2={265} stroke={paleta.text} strokeWidth={3} opacity={sp(14)} />
      <Resistencia
        x={bx + 30}
        y={265}
        largo={60}
        etiqueta="RE"
        valor={fmtOhm(re)}
        aparece={sp(14)}
        color={acento}
        paleta={paleta}
      />
      {/* tierra */}
      <g opacity={sp(16)}>
        <line x1={bx + 30} y1={325} x2={bx + 30} y2={345} stroke={paleta.text} strokeWidth={3} />
        <line x1={bx + 10} y1={345} x2={bx + 50} y2={345} stroke={paleta.text} strokeWidth={3} />
        <line x1={bx + 18} y1={352} x2={bx + 42} y2={352} stroke={paleta.text} strokeWidth={3} />
        <line x1={bx + 25} y1={359} x2={bx + 35} y2={359} stroke={paleta.text} strokeWidth={3} />
      </g>

      {/* Punto de corriente animado bajando por RC */}
      <circle cx={bx + 30} cy={interpolate(flujo, [0, 1], [50, 125])} r={5} fill={paleta.warn} opacity={transistor * 0.9} />

      {/* Nodo de salida (colector) */}
      <g opacity={sp(10)}>
        <circle cx={bx + 30} cy={125} r={5} fill={paleta.wireOut} />
        <line x1={bx + 30} y1={125} x2={400} y2={125} stroke={paleta.wireOut} strokeWidth={2} strokeDasharray="5 5" />
        <text x={405} y={120} fill={paleta.wireOut} fontSize={18} fontFamily={MONO_STACK} fontWeight={700}>
          Vo
        </text>
      </g>
      {/* Nodo de entrada (base) */}
      <g opacity={sp(12)}>
        <text x={20} y={by + 50} fill={acento} fontSize={18} fontFamily={MONO_STACK} fontWeight={700}>
          Vi →
        </text>
      </g>
    </svg>
  )
}
