/*
 * SimulacionSenal.tsx — Senoide de entrada vi y salida vo = vi·|Av| (invertida
 * 180°), con recorte a la máxima excursión simétrica. Slider de amplitud (1..50 mV).
 * Dibujado en <canvas> con useRef + useEffect. Portado desde /web/app.js.
 */
import { useEffect, useRef, useState } from 'react'
import { maxSwing, type Config, type Resultado } from '../lib/engine'
import { fmtTension, redondea } from '../lib/formato'
import { useTema } from '../lib/tema'

interface Props {
  res: Resultado
  config: Config
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Ajusta la resolución del canvas a su tamaño en pantalla (nitidez).
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const W = Math.max(320, Math.round(rect.width))
    const H = 300
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    // Lee colores del tema actual.
    const css = getComputedStyle(document.documentElement)
    const colEje = css.getPropertyValue('--canvas-eje').trim()
    const colRejilla = css.getPropertyValue('--canvas-rejilla').trim()
    const colVi = css.getPropertyValue('--vi-color').trim()
    const colVo = css.getPropertyValue('--vo-color').trim()
    const colTexto = css.getPropertyValue('--texto-tenue').trim()
    const colPeligro = css.getPropertyValue('--peligro').trim()

    // Pico realmente dibujado de la salida (recortado al margen de excursión).
    const voMostrar = swing > 0 ? Math.min(voPicoIdeal, swing) : voPicoIdeal

    // Escala vertical: basada en lo que SE DIBUJA (vi y vo).
    const maxAbs = Math.max(viPico, voMostrar) * 1.15 || 1

    const margenIzq = 44,
      margenDer = 16,
      margenSup = 16,
      margenInf = 28
    const x0 = margenIzq,
      x1 = W - margenDer
    const yMid = (margenSup + (H - margenInf)) / 2
    const altoUtil = (H - margenInf - margenSup) / 2

    const Y = (v: number) => yMid - (v / maxAbs) * altoUtil
    const X = (t: number) => x0 + t * (x1 - x0)

    // --- Rejilla y eje cero ---
    ctx.strokeStyle = colRejilla
    ctx.lineWidth = 1
    for (let gy = 0; gy <= 4; gy++) {
      const yy = margenSup + ((H - margenInf - margenSup) * gy) / 4
      ctx.beginPath()
      ctx.moveTo(x0, yy)
      ctx.lineTo(x1, yy)
      ctx.stroke()
    }
    // Eje X (cero)
    ctx.strokeStyle = colEje
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x0, yMid)
    ctx.lineTo(x1, yMid)
    ctx.stroke()
    // Eje Y
    ctx.beginPath()
    ctx.moveTo(x0, margenSup)
    ctx.lineTo(x0, H - margenInf)
    ctx.stroke()

    // Etiquetas de eje
    ctx.fillStyle = colTexto
    ctx.font = '11px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(fmtTension(maxAbs), x0 - 5, Y(maxAbs) + 4)
    ctx.fillText('0', x0 - 5, yMid + 4)
    ctx.fillText('-' + fmtTension(maxAbs), x0 - 5, Y(-maxAbs) + 4)
    ctx.textAlign = 'center'
    ctx.fillText('tiempo →', (x0 + x1) / 2, H - 8)

    const N = 240
    const ciclos = 2

    // --- Senoide de entrada vi ---
    ctx.strokeStyle = colVi
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const ang = t * ciclos * 2 * Math.PI
      const v = viPico * Math.sin(ang)
      const px = X(t),
        py = Y(v)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // --- Senoide de salida vo = vi·|Av|, invertida 180°, recortada a ±swing ---
    ctx.strokeStyle = colVo
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let j = 0; j <= N; j++) {
      const t2 = j / N
      const ang2 = t2 * ciclos * 2 * Math.PI
      // Inversión de fase: signo negativo explícito.
      let vo = -viPico * absAv * Math.sin(ang2)
      // Recorte simétrico a ±swing.
      if (swing > 0) vo = Math.max(-swing, Math.min(swing, vo))
      const px2 = X(t2),
        py2 = Y(vo)
      if (j === 0) ctx.moveTo(px2, py2)
      else ctx.lineTo(px2, py2)
    }
    ctx.stroke()

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

    // --- Leyenda ---
    ctx.textAlign = 'left'
    ctx.font = '600 12px -apple-system, system-ui, sans-serif'
    const ly = margenSup + 4
    ctx.fillStyle = colVi
    ctx.fillText('■ vi (entrada)', x1 - 150, ly + 8)
    ctx.fillStyle = colVo
    ctx.fillText('■ vo (salida ×' + redondea(absAv) + ', invertida)', x1 - 150, ly + 26)
  }, [amplitudMv, absAv, swing, viPico, voPicoIdeal, recorta, tema])

  // Redibuja al cambiar el tamaño de la ventana (canvas responsive).
  const [, forzar] = useState(0)
  useEffect(() => {
    const onResize = () => forzar((n) => n + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <article className="tarjeta">
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
            onChange={(e) => setAmplitudMv(Number(e.target.value))}
          />
          <output className="valor-amplitud">{amplitudMv} mV</output>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        id="canvas-senal"
        width={560}
        height={300}
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
