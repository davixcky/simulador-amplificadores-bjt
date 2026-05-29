/*
 * Animacion.tsx — Tarjeta con el reproductor Remotion (@remotion/player).
 *
 * Renderiza BAJO DEMANDA la escena del circuito seleccionado con los valores
 * actuales de los sliders (no usa un mp4 pre-renderizado). Al cambiar de
 * circuito o mover un slider, inputProps cambia y el Player refleja los nuevos
 * números (DC/AC recalculados con el engine dentro de la composición).
 */
import { useMemo } from 'react'
import { Player } from '@remotion/player'
import { EscenaCircuito, type PropsEscenaCircuito } from '../remotion/EscenaCircuito'
import type { Circuito } from '../types/circuitos'
import { useTema } from '../lib/tema'

interface Props {
  circuito: Circuito
  valores: Record<string, number>
}

// 7 s a 30 fps. Composición a 1280×720 (16:9).
const FPS = 30
const DURACION_FRAMES = 7 * FPS // 210
const ANCHO = 1280
const ALTO = 720

export default function Animacion({ circuito, valores }: Props) {
  const { tema } = useTema()

  const inputProps = useMemo<PropsEscenaCircuito>(
    () => ({ circuito, valores, tema }),
    [circuito, valores, tema],
  )

  return (
    <article className="tarjeta">
      <h2 className="tarjeta-titulo">Animación</h2>
      <p className="tarjeta-subtitulo">
        Generada bajo demanda con tus valores actuales. Usa los controles para reproducir,
        pausar o desplazarte.
      </p>
      <div
        className="reproductor-animacion"
        style={{ aspectRatio: `${ANCHO} / ${ALTO}` }}
      >
        <Player
          component={EscenaCircuito}
          inputProps={inputProps}
          durationInFrames={DURACION_FRAMES}
          fps={FPS}
          compositionWidth={ANCHO}
          compositionHeight={ALTO}
          loop
          autoPlay
          controls
          style={{ width: '100%', height: '100%' }}
          acknowledgeRemotionLicense
        />
      </div>
    </article>
  )
}
