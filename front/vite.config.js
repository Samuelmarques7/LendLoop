import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// O GitHub Pages serve o site em /LendLoop/ e devolve o 404.html para rotas
// desconhecidas; copiar o index.html para lá faz o BrowserRouter resolver
// links diretos como /LendLoop/produto/123.
function fallbackSpaGithubPages() {
  let pastaSaida
  return {
    name: 'fallback-spa-github-pages',
    apply: 'build',
    configResolved(config) {
      pastaSaida = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(pastaSaida, 'index.html'), resolve(pastaSaida, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/LendLoop/' : '/',
  plugins: [react(), tailwindcss(), fallbackSpaGithubPages()],
}))
