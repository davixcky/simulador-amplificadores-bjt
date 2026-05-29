/*
 * SimulacionSenal.tsx — Senoide de entrada vi y salida vo = vi·|Av| (invertida
 * 180°), con recorte a la máxima excursión simétrica. Slider de amplitud (1..50 mV).
 * Dibujado en <canvas> con useRef + useEffect. Portado desde /web/app.js.
 *
 * Estética "osciloscopio de dashboard": rejilla calmada, ejes con unidades,
 * trazos con relleno de área + glow, banda de recorte, leyenda HUD en píldoras.
 * Animación de crecimiento del pico ~160ms (off con reduced-motion).
 * Se conserva TODA la matemática: vi, vo = −vi·|Av|, recorte a ±swing, dpr.
 */
import { useEffect, useRef, useState } from 'react'
import { maxSwing, type Config, type Resultado } from '../lib/engine'
import { fmtTension, redondea } from '../lib/formato'
import { useTema } from '../lib/tema'

interface Props {
  res: Resultado
  config: Config
}

const FUENTE_EJE = '12px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const FUENTE_HUD = '600 12px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

/** ¿El usuario pidió menos movimiento? Desactiva la interpolación de la onda. */
function reduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

export default function SimulacionSenal({ res, config }: Props) {
  const [amplitudMv, setAmplitudMv] = useState(10)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { tema } = useTema() // redibuja al cambiar de tema (colores del canvas)

  // Cálculos que también alimentan los avisos textuales bajo el canvas.
  const Av = res.ac.Av
  const absAv = Math.abs(Av)
  const swing = maxSwing(res, config) // pico máx. salida (V)
  const viPico = amplitudMv / 1000 // V (pico de entrada)
  const voPicoIdeal = viPico * absAv // V (pico de salida sin recorte)
  const recorta = swing > 0 && voPicoIdeal > swing

  // Progreso de la animación de crecimiento del pico (0..1).
  const animRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Lee colores del tema actual.
    const css = getComputedStyle(document.documentElement)
    const colEje = css.getPropertyValue('--canvas-eje').trim()
    const colRejilla = css.getPropertyValue('--canvas-rejilla').trim()
    const colVi = css.getPropertyValue('--vi-color').trim()
    const colVo = css.getPropertyValue('--vo-color').trim()
    const colTexto = css.getPropertyValue('--texto-tenue').trim()
    const colPeligro = css.getPropertyValue('--peligro').trim()
    const colRecorte = css.getPropertyValue('--canvas-recorte').trim()
    const colTarjeta = css.getPropertyValue('--bg-tarjeta').trim()
    const esOscuro = tema === 'oscuro'

    // Pico realmente dibujado de la salida (recortado al margen de excursión).
    const voMostrar = swing > 0 ? Math.min(voPicoIdeal, swing) : voPicoIdeal
    // Escala vertical: basada en lo que SE DIBUJA (vi y vo).
    const maxAbs = Math.max(viPico, voMostrar) * 1.15 || 1

    /** Dibuja un fotograma con el factor de animación k (0..1) sobre los picos. */
    const dibujar = (k: number) => {
      // Geometría con más aire (H 320, margen izq 52 para etiquetas mono).
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const W = Math.max(320, Math.round(rect.width))
      const H = 320
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const margenIzq = 64, // espacio para etiquetas mono "+2.7 mV" sin recorte
        margenDer = 16,
        margenSup = 16,
        margenInf = 30
      const x0 = margenIzq,
        x1 = W - margenDer
      const yMid = (margenSup + (H - margenInf)) / 2
      const altoUtil = (H - margenInf - margenSup) / 2

      const Y = (v: number) => yMid - (v / maxAbs) * altoUtil
      const X = (t: number) => x0 + t * (x1 - x0)

      // --- Rejilla de osciloscopio (calmada) ---
      ctx.strokeStyle = colRejilla
      ctx.lineWidth = 0.75
      for (let gy = 0; gy <= 4; gy++) {
        const yy = margenSup + ((H - margenInf - margenSup) * gy) / 4
        ctx.beginPath()
        ctx.moveTo(x0, yy)
        ctx.lineTo(x1, yy)
        ctx.stroke()
      }
      // Columnas verticales tenues (cuadrícula) cada cuarto.
      for (let gx = 1; gx < 4; gx++) {
        const xx = x0 + ((x1 - x0) * gx) / 4
        ctx.beginPath()
        ctx.moveTo(xx, margenSup)
        ctx.lineTo(xx, H - margenInf)
        ctx.stroke()
      }
      // Eje Y
      ctx.strokeStyle = colEje
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x0, margenSup)
      ctx.lineTo(x0, H - margenInf)
      ctx.stroke()
      // Eje X (cero, 0 V) más marcado
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(x0, yMid)
      ctx.lineTo(x1, yMid)
      ctx.stroke()

      // --- Banda de recorte (zona saturada) ---
      if (recorta) {
        ctx.fillStyle = colRecorte
        // Banda superior: de +swing al borde superior.
        ctx.fillRect(x0, margenSup, x1 - x0, Y(swing) - margenSup)
        // Banda inferior: de −swing al borde inferior.
        ctx.fillRect(x0, Y(-swing), x1 - x0, H - margenInf - Y(-swing))
      }

      // --- Etiquetas de eje (mono tabular, con unidades) ---
      ctx.fillStyle = colTexto
      ctx.font = FUENTE_EJE
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText('+' + fmtTension(maxAbs), x0 - 7, Y(maxAbs))
      ctx.fillText('0', x0 - 7, yMid)
      ctx.fillText('−' + fmtTension(maxAbs), x0 - 7, Y(-maxAbs))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('tiempo →', (x0 + x1) / 2, H - 9)

      const N = 240
      const ciclos = 2

      /** Dibuja una curva con relleno de área + glow opcional. */
      const trazar = (
        color: string,
        muestra: (t: number) => number,
      ) => {
        // Relleno de área (gradiente vertical a alpha 0).
        const grad = ctx.createLinearGradient(0, margenSup, 0, H - margenInf)
        grad.addColorStop(0, hexAlpha(color, 0.12))
        grad.addColorStop(0.5, hexAlpha(color, 0.04))
        grad.addColorStop(1, hexAlpha(color, 0.12))
        ctx.beginPath()
        ctx.moveTo(X(0), yMid)
        for (let i = 0; i <= N; i++) {
          const t = i / N
          ctx.lineTo(X(t), Y(muestra(t)))
        }
        ctx.lineTo(X(1), yMid)
        ctx.closePath()
        ctx.fillStyle = grad
        ctx.fill()

        // Glow (injerto A): trazo grueso translúcido bajo el nítido.
        ctx.save()
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = esOscuro ? 10 : 4
        ctx.globalAlpha = esOscuro ? 0.18 : 0.06
        ctx.lineWidth = 6
        ctx.beginPath()
        for (let i = 0; i <= N; i++) {
          const t = i / N
          const px = X(t),
            py = Y(muestra(t))
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        ctx.restore()

        // Trazo nítido.
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.lineWidth = 2.25
        ctx.strokeStyle = color
        ctx.beginPath()
        for (let i = 0; i <= N; i++) {
          const t = i / N
          const px = X(t),
            py = Y(muestra(t))
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }

      // --- Senoide de entrada vi ---
      trazar(colVi, (t) => {
        const ang = t * ciclos * 2 * Math.PI
        return viPico * k * Math.sin(ang)
      })

      // --- Senoide de salida vo = vi·|Av|, invertida 180°, recortada a ±swing ---
      trazar(colVo, (t) => {
        const ang2 = t * ciclos * 2 * Math.PI
        // Inversión de fase: signo negativo explícito.
        let vo = -viPico * k * absAv * Math.sin(ang2)
        // Recorte simétrico a ±swing.
        if (swing > 0) vo = Math.max(-swing, Math.min(swing, vo))
        return vo
      })

      // Líneas de recorte (límite ±swing) si satura.
      if (recorta) {
        ctx.strokeStyle = colPeligro
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x0, Y(swing))
        ctx.lineTo(x1, Y(swing))
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x0, Y(-swing))
        ctx.lineTo(x1, Y(-swing))
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Etiqueta "180° invertida" cerca de un cruce por cero de vo.
      ctx.fillStyle = colVo
      ctx.font = FUENTE_HUD
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText('180° invertida', X(0.27), yMid - 14)

      // --- Leyenda HUD: dos píldoras con punto de color + texto mono ---
      ctx.textBaseline = 'middle'
      pildora(ctx, x0 + 8, margenSup + 4, 'vi (entrada)', colVi, colTarjeta, colTexto)
      pildora(
        ctx,
        x0 + 8,
        margenSup + 26,
        'vo (salida ×' + redondea(absAv) + ', invertida)',
        colVo,
        colTarjeta,
        colTexto,
      )

      // Badge "CLIP" en esquina (opacidad fija; el parpadeo se gestiona vía CSS si se desea).
      if (recorta) {
        ctx.font = FUENTE_HUD
        ctx.textAlign = 'right'
        ctx.fillStyle = colPeligro
        ctx.fillText('● CLIP', x1 - 8, margenSup + 6)
      }
    }

    // --- Animación de crecimiento del pico (~160ms) o dibujo directo ---
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (reduceMotion()) {
      animRef.current = 1
      dibujar(1)
    } else {
      const dur = 160
      const desde = animRef.current
      const inicio = performance.now()
      const paso = (ahora: number) => {
        const p = Math.min(1, (ahora - inicio) / dur)
        const k = desde + (1 - desde) * (1 - Math.pow(1 - p, 3)) // easeOutCubic hacia 1
        animRef.current = k
        dibujar(k)
        if (p < 1) rafRef.current = requestAnimationFrame(paso)
        else {
          animRef.current = 1
          rafRef.current = null
        }
      }
      // Reinicia el crecimiento al cambiar amplitud/componente para que "crezca".
      animRef.current = 0
      rafRef.current = requestAnimationFrame(paso)
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [amplitudMv, absAv, swing, viPico, voPicoIdeal, recorta, tema])

  // Redibuja al cambiar el tamaño de la ventana (canvas responsive).
  const [, forzar] = useState(0)
  useEffect(() => {
    const onResize = () => forzar((n) => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <article className="tarjeta tarjeta-simulacion">
      <span className="micro-cabecera">Simulación de señal · osciloscopio</span>
      <h2 className="tarjeta-titulo">Simulación de señal</h2>
      <div className="control-senal">
        <label htmlFor="slider-amplitud">
          Amplitud de entrada v<sub>i</sub>
        </label>
        <div className="fila-control">
          <input
            type="range"
            id="slider-amplitud"
            min={1}
            max={50}
            step={1}
            value={amplitudMv}
            style={{ ['--relleno' as string]: `${((amplitudMv - 1) / 49) * 100}%` }}
            onChange={(e) => setAmplitudMv(Number(e.target.value))}
          />
          <output className="valor-amplitud">{amplitudMv} mV</output>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas-senal"
        width={560}
        height={320}
        role="img"
        aria-label="Gráfica de las señales de entrada y salida del amplificador"
      />
      {recorta ? (
        <p className="aviso aviso-recorte">⚠ La salida satura: hay RECORTE de onda.</p>
      ) : null}
      <p className="leyenda-fase">
        La salida está invertida 180° respecto a la entrada (A<sub>v</sub> &lt; 0). Ganancia |A
        <sub>v</sub>| = {redondea(absAv)}. Excursión máx. simétrica ≈ ±{fmtTension(swing)}.
        {recorta
          ? ' La señal pedida (±' + fmtTension(voPicoIdeal) + ') excede ese límite: hay recorte.'
          : ''}
      </p>
    </article>
  )
}

/** Aplica un canal alfa a un color CSS (#rgb/#rrggbb o rgb()/var resueltos). */
function hexAlpha(color: string, alpha: number): string {
  const c = color.trim()
  // #rrggbb o #rgb
  if (c.startsWith('#')) {
    let r = 0,
      g = 0,
      b = 0
    if (c.length === 7) {
      r = parseInt(c.slice(1, 3), 16)
      g = parseInt(c.slice(3, 5), 16)
      b = parseInt(c.slice(5, 7), 16)
    } else if (c.length === 4) {
      r = parseInt(c[1] + c[1], 16)
      g = parseInt(c[2] + c[2], 16)
      b = parseInt(c[3] + c[3], 16)
    }
    return `rgba(${r},${g},${b},${alpha})`
  }
  // rgb(...) -> rgba(...)
  const m = c.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const partes = m[1].split(',').map((s) => s.trim())
    const [r, g, b] = partes
    return `rgba(${r},${g},${b},${alpha})`
  }
  return c
}

/** Dibuja una píldora redondeada de leyenda con punto de color + texto mono. */
function pildora(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  texto: string,
  colorPunto: string,
  fondo: string,
  colorTexto: string,
) {
  ctx.font = FUENTE_HUD
  ctx.textAlign = 'left'
  const padX = 8,
    rPunto = 4,
    sep = 6,
    alto = 18
  const anchoTexto = ctx.measureText(texto).width
  const ancho = padX + rPunto * 2 + sep + anchoTexto + padX
  const top = y - alto / 2
  // Fondo de la píldora.
  ctx.save()
  ctx.fillStyle = hexAlpha(fondo, 0.85)
  ctx.beginPath()
  redondeado(ctx, x, top, ancho, alto, alto / 2)
  ctx.fill()
  ctx.restore()
  // Punto de color.
  ctx.fillStyle = colorPunto
  ctx.beginPath()
  ctx.arc(x + padX + rPunto, y, rPunto, 0, Math.PI * 2)
  ctx.fill()
  // Texto.
  ctx.fillStyle = colorTexto
  ctx.fillText(texto, x + padX + rPunto * 2 + sep, y)
}

/** Traza un rectángulo redondeado (compatibilidad amplia, sin roundRect). */
function redondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
