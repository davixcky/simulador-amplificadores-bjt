/*
 * EscenaCircuito.tsx — Composición Remotion PARAMETRIZABLE por inputProps.
 *
 * A partir del circuito seleccionado y de los VALORES ACTUALES de los sliders
 * recalcula DC/AC con solve() (el mismo engine de la app) — NO usa los números
 * estáticos del JSON — y anima el esquema, las métricas y la onda de señal.
 *
 * Diseño/animación adaptados de video/src/scenes/CircuitScene.tsx.
 */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { solve, type Config } from '../lib/engine'
import { fmtCorriente, fmtOhm, fmtTension, redondea } from '../lib/formato'
import type { Circuito } from '../types/circuitos'
import { Fondo } from './componentes/Fondo'
import { EsquemaCircuito } from './componentes/EsquemaCircuito'
import { TarjetaMetrica } from './componentes/TarjetaMetrica'
import { OndaSenal } from './componentes/OndaSenal'
import { acentoDeCircuito, FONT_STACK, MONO_STACK, paletaSegunTema } from './tema'
import type { Tema } from '../lib/tema'

/** Props que se pasan al <Player> por inputProps. El índice de string hace
 *  que el tipo sea compatible con la restricción de Remotion (Record<string,
 *  unknown>) sin perder el tipado de cada campo. */
export type PropsEscenaCircuito = {
  circuito: Circuito
  valores: Record<string, number>
  tema: Tema
} & Record<string, unknown>

/** Construye la Config para solve() a partir de los valores actuales. */
function construirConfig(circuito: Circuito, valores: Record<string, number>): Config {
  const c: Config = {
    topologia: circuito.topologia,
    VCC: valores.VCC,
    beta: valores.beta,
  }
  circuito.ajustables.forEach((clave) => {
    if (clave !== 'VCC' && clave !== 'beta') c[clave] = valores[clave]
  })
  return c
}

export function EscenaCircuito({ circuito, valores, tema }: PropsEscenaCircuito) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const paleta = paletaSegunTema(tema)
  const acento = acentoDeCircuito(circuito.id, paleta.accent)

  // Recálculo EN VIVO con el engine. Si la config fuera inválida, valores neutros.
  const config = construirConfig(circuito, valores)
  let resultado
  try {
    resultado = solve(config)
  } catch {
    resultado = null
  }

  const cabecera = spring({ frame, fps, config: { damping: 16, mass: 0.7, stiffness: 120 } })
  const cabeceraX = (1 - cabecera) * -60
  const sub = spring({ frame: frame - 8, fps, config: { damping: 20 } })

  const Av = resultado?.ac.Av ?? 0
  const indice = ['c1', 'c2', 'c3'].indexOf(circuito.id) + 1 || 1

  return (
    <AbsoluteFill>
      <Fondo acento={acento} paleta={paleta} />
      <AbsoluteFill style={{ padding: '44px 56px' }}>
        {/* Cabecera */}
        <div style={{ transform: `translateX(${cabeceraX}px)`, opacity: cabecera }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                fontFamily: MONO_STACK,
                fontSize: 34,
                fontWeight: 800,
                color: paleta.bg,
                background: acento,
                borderRadius: 14,
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {indice}
            </div>
            <div>
              <h2
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 44,
                  fontWeight: 800,
                  color: paleta.text,
                  margin: 0,
                  lineHeight: 1.05,
                }}
              >
                {circuito.nombre}
              </h2>
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: 23,
                  color: acento,
                  fontWeight: 600,
                  marginTop: 4,
                  opacity: sub,
                }}
              >
                {circuito.subtitulo}
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo: izquierda esquema + señal; derecha métricas */}
        <div style={{ display: 'flex', gap: 36, marginTop: 18, flex: 1 }}>
          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <EsquemaCircuito config={config} inicioFrame={0} acento={acento} paleta={paleta} />
            </div>
            <div style={{ marginTop: -8 }}>
              <OndaSenal Av={Av} inicioFrame={28} duracionTrazo={70} acento={acento} paleta={paleta} ancho={520} />
            </div>
          </div>

          {/* Columna derecha: métricas */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 21,
                fontWeight: 700,
                color: paleta.textDim,
                letterSpacing: 3,
                opacity: interpolate(frame, [18, 30], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              ANÁLISIS DC
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <TarjetaMetrica
                etiqueta="IC"
                valor={resultado ? fmtCorriente(resultado.dc.IC) : '—'}
                retardo={22}
                acento={acento}
                paleta={paleta}
              />
              <TarjetaMetrica
                etiqueta="VCE"
                valor={resultado ? fmtTension(resultado.dc.VCE) : '—'}
                retardo={28}
                acento={acento}
                paleta={paleta}
              />
              <TarjetaMetrica
                etiqueta="re = 26mV/IE"
                valor={resultado ? fmtOhm(resultado.dc.re) : '—'}
                retardo={34}
                acento={acento}
                paleta={paleta}
              />
            </div>

            <div
              style={{
                fontFamily: FONT_STACK,
                fontSize: 21,
                fontWeight: 700,
                color: paleta.textDim,
                letterSpacing: 3,
                marginTop: 8,
                opacity: interpolate(frame, [44, 56], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              ANÁLISIS AC
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <TarjetaMetrica
                etiqueta="Av (ganancia)"
                valor={resultado ? redondea(Av) : '—'}
                sub={Av < 0 ? 'invierte la fase' : 'en fase'}
                retardo={48}
                acento={acento}
                paleta={paleta}
                destacada
              />
              <TarjetaMetrica
                etiqueta="Zi"
                valor={resultado ? fmtOhm(resultado.ac.Zi) : '—'}
                retardo={54}
                acento={acento}
                paleta={paleta}
              />
              <TarjetaMetrica
                etiqueta="Zo"
                valor={resultado ? fmtOhm(resultado.ac.Zo) : '—'}
                retardo={58}
                acento={acento}
                paleta={paleta}
              />
            </div>
          </div>
        </div>

        {/* Nota al pie */}
        <div
          style={{
            fontFamily: FONT_STACK,
            fontSize: 18,
            color: paleta.textDim,
            opacity: interpolate(frame, [100, 120], [0, 0.9], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            borderLeft: `3px solid ${acento}`,
            paddingLeft: 14,
            maxWidth: 1160,
          }}
        >
          {circuito.nota}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
