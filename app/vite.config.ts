import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: './' → rutas relativas para que funcione en GitHub Pages y en file/local.
export default defineConfig({
  base: './',
  plugins: [react()],
})
