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
