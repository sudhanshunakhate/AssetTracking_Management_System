import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // @stomp/stompjs references Node's `global` in the browser build
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@stomp/stompjs'],
  },
  build: {
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      // Use http target + ws:true (not ws://) so the proxy upgrades cleanly.
      '/ws': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        ws: true,
        // Backend down → log once-friendly; avoid crashing the Vite process.
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[vite] /ws proxy:', err.message)
          })
        },
      },
    },
  },
})
