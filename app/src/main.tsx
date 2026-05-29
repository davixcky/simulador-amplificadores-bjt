import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ProveedorTema } from './lib/tema'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorTema>
      <App />
    </ProveedorTema>
  </StrictMode>,
)

/* Activa la animación de entrada SOLO tras el primer pintado real. Doble rAF
   garantiza que las tarjetas ya están visibles antes de animarlas; si el render
   es headless/sin rAF, las tarjetas quedan visibles (la clase nunca se añade). */
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add('con-entrada')
  })
})
