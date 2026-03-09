import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5111,
    host: '0.0.0.0', // Listen on all network interfaces, not just localhost
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5112',
        changeOrigin: true,
      },
      '/Road Trip': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/Road Trip Alternatives': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
