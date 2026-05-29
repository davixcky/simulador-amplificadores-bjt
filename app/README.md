# Simulador de Amplificadores BJT — App (React + Vite + TypeScript)

Reescritura en React de la web app del simulador de amplificadores BJT
(análisis DC y AC con el modelo r<sub>e</sub>). Misma funcionalidad que la
versión vanilla de `/web`, en español.

Los datos provienen de `src/data/circuitos.json`, copia que refleja la fuente
de verdad del proyecto en `/datos/circuitos.json`.

## Requisitos

- Node.js 18+ y npm.

## Scripts

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo con recarga en caliente
npm run build    # compila TypeScript y genera la build de producción en dist/
npm run preview  # sirve la build de producción para previsualizarla
```

## Notas

- `vite.config.ts` usa `base: './'` para que las rutas sean relativas y la
  build funcione en GitHub Pages y abriendo `dist/index.html` en local.
- Tema claro/oscuro persistido en `localStorage`, inicial según
  `prefers-color-scheme`. Admite `?tema=claro|oscuro` y `?circuito=c1|c2|c3`
  por URL.
- Sin recursos externos (sin CDNs): fuentes del sistema, esquemas en SVG y
  simulación de señal en `<canvas>`.
