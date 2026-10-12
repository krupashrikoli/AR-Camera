import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
    optimizeDeps: {
      include: ['three'],
      exclude: ['mind-ar'],
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
  }
})

