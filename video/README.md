# Video didáctico — Amplificadores BJT (Remotion)

Vídeo en español (1280×720, 30 fps, ~22.5 s) sobre los tres amplificadores BJT
del simulador: **realimentación de colector**, **divisor de voltaje** y
**polarización de emisor**. Para cada uno muestra su esquema animado, los números
clave de **DC** (IC, VCE, r_e) y **AC** (Av, Zi, Zo), y una animación de la señal
de entrada frente a la de salida resaltando la **ganancia** y la **inversión de
fase de 180°**.

Hecho con [Remotion](https://www.remotion.dev/) + React. Tipografía del sistema
(no requiere descargar fuentes).

## Requisitos

- Node.js y npm
- Google Chrome / Chromium (para renderizar). En este equipo:
  `/usr/bin/google-chrome-stable`
- ffmpeg (incluido en el flujo de Remotion / disponible en `/usr/bin/ffmpeg`)

## Instalación

```bash
npm install
```

## Studio (previsualización interactiva)

```bash
npm start
```

Abre Remotion Studio en el navegador para previsualizar y depurar la
composición `BJT` cuadro a cuadro.

## Render a MP4

Atajo (usa Chrome del sistema, backend GL `angle`, 2 hilos):

```bash
npm run render
```

Equivale a:

```bash
npx remotion render BJT out/bjt-amplificadores.mp4 \
  --browser-executable=/usr/bin/google-chrome-stable \
  --gl=angle \
  --concurrency=2
```

El resultado se escribe en `out/bjt-amplificadores.mp4`.

### Si el render falla

- **Sandbox de Chrome**: añade `--no-sandbox`.
- **OpenGL / GPU**: prueba `--gl=swiftshader` (software) en lugar de `--gl=angle`.

## Datos

Las cifras provienen de `src/circuitos.json`, copia de
`../datos/circuitos.json` (datos canónicos del simulador, modelo r_e con
VBE = 0.7 V, VT = 26 mV, ro = ∞). Las fórmulas de referencia están en
`../web/engine.js`.

## Estructura

```
video/
├── package.json
├── remotion.config.ts
├── tsconfig.json
└── src/
    ├── index.ts              # registerRoot
    ├── Root.tsx              # <Composition id="BJT" 1280x720 30fps>
    ├── BjtVideo.tsx          # TransitionSeries: intro → 3 circuitos → cierre
    ├── data.ts               # tipos + formateo (mA/µA, kΩ/Ω, V, ganancia)
    ├── theme.ts              # paleta y tipografía del sistema
    ├── circuitos.json        # datos canónicos (copia)
    ├── scenes/
    │   ├── Intro.tsx
    │   ├── CircuitScene.tsx  # esquema + métricas + señal por circuito
    │   └── Outro.tsx
    └── components/
        ├── Background.tsx
        ├── CircuitSchematic.tsx  # SVG del transistor + resistencias clave
        ├── MetricCard.tsx        # tarjeta de número con animación spring
        └── SignalWave.tsx        # senoides entrada/salida dibujadas por frame
```
