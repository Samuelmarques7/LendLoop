import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// No GitHub Pages o site fica em https://<usuario>.github.io/LendLoop/
export default defineConfig(({ mode }) => ({
  base: mode === 'gh-pages' ? '/LendLoop/' : '/',
  plugins: [react(), tailwindcss()],
}))
