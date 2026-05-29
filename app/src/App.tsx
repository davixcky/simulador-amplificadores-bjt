/*
 * App.tsx — Componente raíz del simulador.
 * Gestiona el circuito seleccionado, los valores de componentes y el recálculo
 * EN VIVO con el engine. Soporta ?circuito=c1|c2|c3 por URL.
 */
import { useMemo, useState } from 'react'
import { CIRCUITOS } from './data/circuitos'
import { solve, type Config } from './lib/engine'
import BotonTema from './components/BotonTema'
import SelectorCircuito from './components/SelectorCircuito'
import Esquema from './components/Esquema'
import Controles from './components/Controles'
import PanelDC from './components/PanelDC'
import PanelAC from './components/PanelAC'
import Ecuaciones from './components/Ecuaciones'
import SimulacionSenal from './components/SimulacionSenal'
import Animacion from './components/Animacion'

/** Circuito inicial: respeta ?circuito=c1|c2|c3 si es válido. */
function circuitoInicial(): string {
  const porDefecto = CIRCUITOS[0].id
  try {
    const q = new URLSearchParams(window.location.search).get('circuito')
    if (q && CIRCUITOS.some((c) => c.id === q)) return q
  } catch {
    /* sin URL */
  }
  return porDefecto
}

export default function App() {
  const [idCircuito, setIdCircuito] = useState<string>(circuitoInicial)
  const preset = useMemo(
    () => CIRCUITOS.find((c) => c.id === idCircuito) ?? CIRCUITOS[0],
    [idCircuito],
  )

  // Valores actuales de TODOS los componentes (copia de los del preset).
  const [valores, setValores] = useState<Record<string, number>>({ ...preset.componentes })

  // Al cambiar de circuito, reinicia los valores a los del nuevo preset.
  const seleccionarCircuito = (id: string) => {
    setIdCircuito(id)
    const nuevo = CIRCUITOS.find((c) => c.id === id) ?? CIRCUITOS[0]
    setValores({ ...nuevo.componentes })
  }

  const cambiarValor = (nombre: string, valor: number) => {
    setValores((v) => ({ ...v, [nombre]: valor }))
  }

  const restablecer = () => {
    setValores({ ...preset.componentes })
  }

  // Construye la config para solve() con solo las resistencias de la topología.
  const config: Config = useMemo(() => {
    const c: Config = {
      topologia: preset.topologia,
      VCC: valores.VCC,
      beta: valores.beta,
    }
    preset.ajustables.forEach((clave) => {
      if (clave !== 'VCC' && clave !== 'beta') c[clave] = valores[clave]
    })
    return c
  }, [preset, valores])

  // Recálculo EN VIVO. Si la config es inválida momentáneamente, no rompe la UI.
  const resultado = useMemo(() => {
    try {
      return solve(config)
    } catch {
      return null
    }
  }, [config])

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-texto">
          <h1>Simulador de Amplificadores BJT</h1>
          <p className="subtitulo">
            Análisis DC y AC con el modelo r<sub>e</sub> · Supuestos: V<sub>BE</sub>&nbsp;=&nbsp;0.7&nbsp;V,
            V<sub>T</sub>&nbsp;=&nbsp;26&nbsp;mV, r<sub>o</sub>&nbsp;=&nbsp;∞
          </p>
        </div>
        <BotonTema />
      </header>

      <SelectorCircuito
        circuitos={CIRCUITOS}
        seleccionado={idCircuito}
        onSeleccionar={seleccionarCircuito}
      />

      <main className="rejilla">
        {/* PANEL IZQUIERDO: esquema + controles */}
        <section className="columna columna-izquierda" aria-label="Esquema y controles">
          <article className="tarjeta">
            <h2 className="tarjeta-titulo">{preset.nombre}</h2>
            <p className="tarjeta-subtitulo">{preset.subtitulo}</p>
            <Esquema topologia={preset.topologia} config={config} reBypass={preset.re_bypass} />
          </article>

          <Controles
            ajustables={preset.ajustables}
            porDefecto={preset.componentes}
            valores={valores}
            onCambio={cambiarValor}
            onRestablecer={restablecer}
          />
        </section>

        {/* PANEL DERECHO: resultados */}
        <section className="columna columna-derecha" aria-label="Resultados del análisis">
          {resultado ? (
            <>
              <PanelDC res={resultado} vcc={valores.VCC} />
              <PanelAC res={resultado} />
              <Ecuaciones
                ecuacionesDC={preset.ecuaciones_dc}
                ecuacionesAC={preset.ecuaciones_ac}
                config={config}
                res={resultado}
              />
              <SimulacionSenal res={resultado} config={config} />
              <Animacion circuito={preset} valores={valores} />
            </>
          ) : null}
        </section>
      </main>

      <footer className="pie">
        <p>
          Modelo simplificado de pequeña señal (r<sub>e</sub>, r<sub>o</sub>&nbsp;=&nbsp;∞). Valores
          orientativos para fines didácticos.
        </p>
        <p className="pie-pdf">
          Para regenerar el PDF de referencia, ejecuta el generador del proyecto desde{' '}
          <code>datos/circuitos.json</code>.
        </p>
      </footer>
    </>
  )
}
