import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cwd } from 'node:process'
import { defineConfig, loadEnv } from 'vite'
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
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, cwd(), '')

  if (command === 'build' && !env.VITE_MP_PUBLIC_KEY?.trim()) {
    throw new Error('VITE_MP_PUBLIC_KEY precisa estar configurada para gerar o checkout de produção.')
  }

  return {
    base: command === 'build' ? '/LendLoop/' : '/',
    plugins: [react(), tailwindcss(), fallbackSpaGithubPages()],
  }
})
