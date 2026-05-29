/*
 * Esquema.tsx — Dibujo SVG de los 3 esquemas. Portado desde /web/app.js
 * (svgDivisor, svgEmisor, svgRealimentacion y sus primitivas).
 *
 * Todo el dibujo usa stroke/fill = currentColor para respetar el tema.
 * Las etiquetas de resistencias verticales van a la DERECHA para no solaparse
 * con el zig-zag (anclaje "start"); las horizontales van debajo y centradas.
 */
import { Fragment, type ReactNode } from 'react'
import type { Config } from '../lib/engine'
import { fmtOhm, fmtTension } from '../lib/formato'

// --- Primitivas de dibujo (devuelven elementos React/SVG) ---

/** Etiqueta de resistencia con subíndice. */
function EtqR({ nombre }: { nombre: string }) {
  const m = nombre.match(/^R(.+)$/)
  if (!m) return <>{nombre}</>
  return (
    <>
      R
      <tspan baselineShift="sub" fontSize="9">
        {m[1]}
      </tspan>
    </>
  )
}

interface ResistenciaProps {
  x1: number
  y1: number
  x2: number
  y2: number
  etiqueta: ReactNode
  valor: string
}

/** Resistencia en zig-zag entre (x1,y1) y (x2,y2) con etiqueta. */
function Resistencia({ x1, y1, x2, y2, etiqueta, valor }: ResistenciaProps) {
  const dx = x2 - x1,
    dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len,
    uy = dy / len // vector unitario eje
  const px = -uy,
    py = ux // perpendicular
  const zig = 6,
    amp = 7,
    segs = zig * 2
  const inicio = len * 0.25,
    fin = len * 0.75 // tramos rectos en extremos
  let d = 'M' + x1 + ',' + y1
  // Tramo recto inicial
  const sx = x1 + ux * inicio,
    sy = y1 + uy * inicio
  d += ' L' + sx + ',' + sy
  const paso = (fin - inicio) / segs
  for (let i = 1; i <= segs; i++) {
    const along = inicio + paso * i
    const lado = i % 2 === 0 ? 0 : i % 4 === 1 ? 1 : -1
    const bx = x1 + ux * along + px * amp * lado
    const by = y1 + uy * along + py * amp * lado
    d += ' L' + bx + ',' + by
  }
  // Tramo recto final
  d += ' L' + x2 + ',' + y2
  // Etiqueta: horizontal -> debajo y centrada; vertical -> a la derecha, libre del zig-zag.
  const cx = (x1 + x2) / 2,
    cy = (y1 + y2) / 2
  const horizontal = Math.abs(ux) > Math.abs(uy)
  let lx: number, ly: number, anclaje: 'middle' | 'start'
  if (horizontal) {
    lx = cx
    ly = cy + 22
    anclaje = 'middle'
  } else {
    lx = cx + 18
    ly = cy
    anclaje = 'start'
  }
  return (
    <>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} />
      <text x={lx} y={ly - 4} textAnchor={anclaje} className="esquema-etiqueta">
        {etiqueta}
      </text>
      <text x={lx} y={ly + 11} textAnchor={anclaje} className="esquema-valor">
        {valor}
      </text>
    </>
  )
}

function Cable({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2} />
}

function Nodo({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r={3} fill="currentColor" />
}

/** Condensador (dos placas) en horizontal o vertical. */
function Condensador({
  x,
  y,
  horizontal,
  etiqueta,
}: {
  x: number
  y: number
  horizontal: boolean
  etiqueta?: ReactNode
}) {
  const placas = horizontal ? (
    <>
      <line x1={x - 2} y1={y - 9} x2={x - 2} y2={y + 9} stroke="currentColor" strokeWidth={2} />
      <line x1={x + 2} y1={y - 9} x2={x + 2} y2={y + 9} stroke="currentColor" strokeWidth={2} />
    </>
  ) : (
    <>
      <line x1={x - 9} y1={y - 2} x2={x + 9} y2={y - 2} stroke="currentColor" strokeWidth={2} />
      <line x1={x - 9} y1={y + 2} x2={x + 9} y2={y + 2} stroke="currentColor" strokeWidth={2} />
    </>
  )
  return (
    <>
      {placas}
      {etiqueta ? (
        <text x={x + 12} y={y + 4} textAnchor="start" className="esquema-valor">
          {etiqueta}
        </text>
      ) : null}
    </>
  )
}

/** Transistor NPN: círculo, base, colector y emisor con flecha (emisor saliente). */
function TransistorNPN({ x, y }: { x: number; y: number }) {
  const r = 26
  const bx = x - r // entrada de base (izquierda del círculo)
  return (
    <>
      <circle cx={x} cy={y} r={r} fill="none" stroke="currentColor" strokeWidth={2} />
      {/* Barra vertical de base */}
      <line x1={x - 9} y1={y - 13} x2={x - 9} y2={y + 13} stroke="currentColor" strokeWidth={2.5} />
      {/* Terminal de base hacia la izquierda */}
      <Cable x1={bx} y1={y} x2={x - 9} y2={y} />
      {/* Colector (arriba) y emisor (abajo) hacia la barra */}
      <line x1={x - 9} y1={y - 8} x2={x + 14} y2={y - 20} stroke="currentColor" strokeWidth={2} />
      <line x1={x - 9} y1={y + 8} x2={x + 14} y2={y + 20} stroke="currentColor" strokeWidth={2} />
      {/* Terminales externos */}
      <Cable x1={x + 14} y1={y - 20} x2={x + 14} y2={y - r - 6} />
      <Cable x1={x + 14} y1={y + 20} x2={x + 14} y2={y + r + 6} />
      {/* Flecha del emisor (NPN: apunta hacia fuera) */}
      <path
        d={'M' + (x + 7) + ',' + (y + 12) + ' L' + (x + 14) + ',' + (y + 20) + ' L' + (x + 4) + ',' + (y + 19) + ' Z'}
        fill="currentColor"
      />
    </>
  )
}

/** Símbolo de VCC (alimentación) en la parte superior. */
function FuenteVCC({ x, y, valor }: { x: number; y: number; valor: number }) {
  return (
    <>
      <Cable x1={x} y1={y} x2={x} y2={y + 12} />
      <text x={x} y={y - 6} textAnchor="middle" className="esquema-etiqueta">
        +V
        <tspan baselineShift="sub" fontSize="9">
          CC
        </tspan>
      </text>
      <text x={x} y={y - 22} textAnchor="middle" className="esquema-valor">
        {fmtTension(valor)}
      </text>
    </>
  )
}

/** Tierra (GND). */
function Tierra({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Cable x1={x} y1={y} x2={x} y2={y + 10} />
      <line x1={x - 12} y1={y + 10} x2={x + 12} y2={y + 10} stroke="currentColor" strokeWidth={2} />
      <line x1={x - 7} y1={y + 15} x2={x + 7} y2={y + 15} stroke="currentColor" strokeWidth={2} />
      <line x1={x - 3} y1={y + 20} x2={x + 3} y2={y + 20} stroke="currentColor" strokeWidth={2} />
    </>
  )
}

/** Etiqueta v_i / v_o (con subíndice). */
function EtqV({ x, y, anchor, sub }: { x: number; y: number; anchor: 'middle' | 'start'; sub: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className="esquema-valor">
      v
      <tspan baselineShift="sub" fontSize="9">
        {sub}
      </tspan>
    </text>
  )
}

/** Condensador de desacoplo de emisor (CE) en paralelo con RE. */
function BypassCE({ xCol }: { xCol: number }) {
  const xCE = xCol + 72
  return (
    <>
      <Cable x1={xCol} y1={240} x2={xCE} y2={240} />
      <Cable x1={xCE} y1={240} x2={xCE} y2={262} />
      <Condensador x={xCE} y={270} horizontal={false} />
      <Cable x1={xCE} y1={278} x2={xCE} y2={300} />
      <Cable x1={xCE} y1={300} x2={xCol} y2={300} />
      <text x={xCE + 12} y={274} textAnchor="start" className="esquema-valor">
        C
        <tspan baselineShift="sub" fontSize="9">
          E
        </tspan>
      </text>
    </>
  )
}

// ---- Divisor de voltaje: R1, R2, RC, RE (con condensador si re_bypass) ----
function SvgDivisor({ c, reBypass }: { c: Config; reBypass: boolean }) {
  const xBase = 90,
    xCol = 230,
    yTopo = 30
  const yB = 165
  return (
    <Fragment>
      <FuenteVCC x={xCol} y={yTopo} valor={c.VCC} />
      <Cable x1={xBase} y1={42} x2={xCol} y2={42} />
      <Cable x1={xCol} y1={42} x2={xCol} y2={60} />
      <Resistencia x1={xBase} y1={42} x2={xBase} y2={130} etiqueta={<EtqR nombre="R1" />} valor={fmtOhm(c.R1!)} />
      <Cable x1={xBase} y1={130} x2={xBase} y2={yB} />
      <Nodo x={xBase} y={yB} />
      <Resistencia x1={xBase} y1={yB} x2={xBase} y2={280} etiqueta={<EtqR nombre="R2" />} valor={fmtOhm(c.R2!)} />
      <Cable x1={xBase} y1={280} x2={xBase} y2={320} />
      <Tierra x={xBase} y={320} />
      <Resistencia x1={xCol} y1={60} x2={xCol} y2={140} etiqueta={<EtqR nombre="RC" />} valor={fmtOhm(c.RC!)} />
      <Cable x1={xCol} y1={140} x2={xCol} y2={152} />
      <TransistorNPN x={xCol} y={185} />
      <Cable x1={xCol} y1={140} x2={xCol - 14} y2={140} />
      {/* Entrada */}
      <Cable x1={30} y1={yB} x2={60} y2={yB} />
      <Condensador x={60} y={yB} horizontal={true} />
      <Cable x1={64} y1={yB} x2={xBase} y2={yB} />
      <EtqV x={30} y={yB - 12} anchor="middle" sub="i" />
      {/* Salida */}
      <Cable x1={xCol + 14} y1={152} x2={xCol + 14} y2={140} />
      <Cable x1={xCol + 14} y1={152} x2={300} y2={152} />
      <Condensador x={300} y={152} horizontal={true} />
      <Cable x1={304} y1={152} x2={330} y2={152} />
      <EtqV x={335} y={156} anchor="start" sub="o" />
      {/* Emisor -> RE */}
      <Cable x1={xCol + 14} y1={217} x2={xCol + 14} y2={240} />
      <Cable x1={xCol + 14} y1={240} x2={xCol} y2={240} />
      <Resistencia x1={xCol} y1={240} x2={xCol} y2={300} etiqueta={<EtqR nombre="RE" />} valor={fmtOhm(c.RE!)} />
      <Cable x1={xCol} y1={300} x2={xCol} y2={320} />
      <Tierra x={xCol} y={320} />
      {reBypass ? <BypassCE xCol={xCol} /> : null}
    </Fragment>
  )
}

// ---- Polarización de emisor: RB, RC, RE ----
function SvgEmisor({ c, reBypass }: { c: Config; reBypass: boolean }) {
  const xBase = 90,
    xCol = 230,
    yTopo = 30
  const yB = 185
  return (
    <Fragment>
      <FuenteVCC x={xCol} y={yTopo} valor={c.VCC} />
      <Cable x1={xBase} y1={42} x2={xCol} y2={42} />
      <Cable x1={xCol} y1={42} x2={xCol} y2={60} />
      <Resistencia x1={xBase} y1={42} x2={xBase} y2={150} etiqueta={<EtqR nombre="RB" />} valor={fmtOhm(c.RB!)} />
      <Cable x1={xBase} y1={150} x2={xBase} y2={yB} />
      <Nodo x={xBase} y={yB} />
      <Resistencia x1={xCol} y1={60} x2={xCol} y2={140} etiqueta={<EtqR nombre="RC" />} valor={fmtOhm(c.RC!)} />
      <Cable x1={xCol} y1={140} x2={xCol} y2={152} />
      <TransistorNPN x={xCol} y={185} />
      <Cable x1={xBase} y1={yB} x2={xCol - 26} y2={yB} />
      {/* Entrada */}
      <Cable x1={30} y1={yB} x2={60} y2={yB} />
      <Condensador x={60} y={yB} horizontal={true} />
      <Cable x1={64} y1={yB} x2={xBase} y2={yB} />
      <EtqV x={30} y={yB - 12} anchor="middle" sub="i" />
      {/* Salida */}
      <Cable x1={xCol + 14} y1={152} x2={300} y2={152} />
      <Condensador x={300} y={152} horizontal={true} />
      <Cable x1={304} y1={152} x2={330} y2={152} />
      <EtqV x={335} y={156} anchor="start" sub="o" />
      {/* Emisor -> RE */}
      <Cable x1={xCol + 14} y1={217} x2={xCol + 14} y2={240} />
      <Cable x1={xCol + 14} y1={240} x2={xCol} y2={240} />
      <Resistencia x1={xCol} y1={240} x2={xCol} y2={300} etiqueta={<EtqR nombre="RE" />} valor={fmtOhm(c.RE!)} />
      <Cable x1={xCol} y1={300} x2={xCol} y2={320} />
      <Tierra x={xCol} y={320} />
      {reBypass ? <BypassCE xCol={xCol} /> : null}
    </Fragment>
  )
}

// ---- Realimentación de colector: RF (de colector a base), RC, RE (sin bypass) ----
function SvgRealimentacion({ c }: { c: Config }) {
  const xBase = 90,
    xCol = 230,
    yTopo = 30
  const yCol = 140
  const yB = 185
  return (
    <Fragment>
      <FuenteVCC x={xCol} y={yTopo} valor={c.VCC} />
      <Cable x1={xCol} y1={42} x2={xCol} y2={60} />
      <Resistencia x1={xCol} y1={60} x2={xCol} y2={140} etiqueta={<EtqR nombre="RC" />} valor={fmtOhm(c.RC!)} />
      <Cable x1={xCol} y1={yCol} x2={xCol} y2={152} />
      <Nodo x={xCol} y={yCol} />
      <TransistorNPN x={xCol} y={185} />
      <Nodo x={xBase} y={yB} />
      <Cable x1={xBase} y1={yB} x2={xCol - 26} y2={yB} />
      {/* RF: del colector (arriba) a la base — realimentación */}
      <Cable x1={xCol} y1={yCol} x2={xCol} y2={95} />
      <Cable x1={xBase} y1={95} x2={xBase} y2={yB} />
      <Resistencia x1={xBase} y1={95} x2={xCol} y2={95} etiqueta={<EtqR nombre="RF" />} valor={fmtOhm(c.RF!)} />
      {/* Entrada */}
      <Cable x1={30} y1={yB} x2={55} y2={yB} />
      <Condensador x={55} y={yB} horizontal={true} />
      <Cable x1={59} y1={yB} x2={xBase} y2={yB} />
      <EtqV x={30} y={yB - 12} anchor="middle" sub="i" />
      {/* Salida desde colector */}
      <Cable x1={xCol + 14} y1={152} x2={300} y2={152} />
      <Condensador x={300} y={152} horizontal={true} />
      <Cable x1={304} y1={152} x2={330} y2={152} />
      <EtqV x={335} y={156} anchor="start" sub="o" />
      {/* Emisor -> RE (sin condensador de desacoplo) */}
      <Cable x1={xCol + 14} y1={217} x2={xCol + 14} y2={240} />
      <Cable x1={xCol + 14} y1={240} x2={xCol} y2={240} />
      <Resistencia x1={xCol} y1={240} x2={xCol} y2={300} etiqueta={<EtqR nombre="RE" />} valor={fmtOhm(c.RE!)} />
      <Cable x1={xCol} y1={300} x2={xCol} y2={320} />
      <Tierra x={xCol} y={320} />
    </Fragment>
  )
}

interface EsquemaProps {
  topologia: Config['topologia']
  config: Config
  reBypass: boolean
}

export default function Esquema({ topologia, config, reBypass }: EsquemaProps) {
  let contenido: ReactNode
  if (topologia === 'voltage_divider') contenido = <SvgDivisor c={config} reBypass={reBypass} />
  else if (topologia === 'emitter_bias') contenido = <SvgEmisor c={config} reBypass={reBypass} />
  else contenido = <SvgRealimentacion c={config} />

  return (
    <div className="esquema-contenedor">
      <svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" role="img">
        {contenido}
      </svg>
    </div>
  )
}
