/*
 * Controles.tsx — Slider + campo numérico por componente ajustable, β y VCC.
 * Resistencias en escala logarítmica. Botón Restablecer.
 */
import { useState } from 'react'
import {
  etiquetaComponente,
  etiquetaTexto,
  posLogAValor,
  rangoComponente,
  valorAPosLog,
  valorCampo,
} from '../lib/componentes'

interface ControlProps {
  nombre: string
  porDefecto: number
  valor: number
  onCambio: (nombre: string, valor: number) => void
  onResaltar: (nombre: string | null) => void
}

function Control({ nombre, porDefecto, valor, onCambio, onResaltar }: ControlProps) {
  // Estado local de resaltado (label en acento) sincronizado con el del esquema.
  const [activo, setActivo] = useState(false)
  const r = rangoComponente(nombre, porDefecto)
  const etiqueta = etiquetaComponente(nombre)
  const etqTexto = etiquetaTexto(nombre)

  // Slider: escala log usa posición 0..1000 -> valor exponencial.
  const sliderMin = r.log ? 0 : r.min
  const sliderMax = r.log ? 1000 : r.max
  const sliderStep = r.log ? 1 : r.paso
  const sliderValor = r.log ? valorAPosLog(valor, r) : valor

  // Posición del relleno de progreso (0..100%) para el gradiente del track.
  const pct = ((sliderValor - sliderMin) / (sliderMax - sliderMin)) * 100
  const relleno = { '--relleno': `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties

  const onSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bruto = Number(e.target.value)
    const v = r.log ? posLogAValor(bruto, r) : bruto
    onCambio(nombre, v)
  }

  const onCampo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (!isFinite(v) || v <= 0) return // ignora entradas inválidas
    const acotado = Math.min(r.max, Math.max(r.min, v))
    onCambio(nombre, acotado)
  }

  // Reporta el componente resaltado al pasar el ratón / enfocar (§4.7).
  const activar = () => {
    setActivo(true)
    onResaltar(nombre)
  }
  const desactivar = () => {
    setActivo(false)
    onResaltar(null)
  }

  return (
    <div
      className={'control-grupo' + (activo ? ' control-activo' : '')}
      onMouseEnter={activar}
      onMouseLeave={desactivar}
      onFocus={activar}
      onBlur={desactivar}
    >
      <label htmlFor={'sl-' + nombre}>{etiqueta}</label>
      <div className="fila-control">
        <input
          type="range"
          id={'sl-' + nombre}
          aria-label={etqTexto + ' (deslizador)'}
          style={relleno}
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={sliderValor}
          onChange={onSlider}
        />
        <input
          type="number"
          id={'in-' + nombre}
          className="campo-numerico"
          aria-label={etqTexto + ' (valor)'}
          min={r.min}
          max={r.max}
          step={r.log ? 'any' : r.paso}
          value={valorCampo(nombre, valor)}
          onChange={onCampo}
        />
        <span className="unidad-campo">{r.unidad}</span>
      </div>
    </div>
  )
}

interface Props {
  ajustables: string[]
  porDefecto: Record<string, number>
  valores: Record<string, number>
  onCambio: (nombre: string, valor: number) => void
  onRestablecer: () => void
  onResaltar: (nombre: string | null) => void
}

export default function Controles({
  ajustables,
  porDefecto,
  valores,
  onCambio,
  onRestablecer,
  onResaltar,
}: Props) {
  return (
    <article className="tarjeta">
      <div className="tarjeta-cabecera">
        <h2 className="tarjeta-titulo">Controles</h2>
        <button className="btn-secundario" type="button" onClick={onRestablecer}>
          Restablecer
        </button>
      </div>
      <div className="controles">
        {ajustables.map((nombre) => (
          <Control
            key={nombre}
            nombre={nombre}
            porDefecto={porDefecto[nombre]}
            valor={valores[nombre]}
            onCambio={onCambio}
            onResaltar={onResaltar}
          />
        ))}
      </div>
    </article>
  )
}
