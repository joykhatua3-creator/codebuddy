import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      external: ['canvg'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) return 'charts';
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'editor';
            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@tanstack/react-query')
            ) {
              return 'vendor';
            }
          }
        },
      },
    },
  },
})
