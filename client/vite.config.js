import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },

  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  },

  build: {
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue core
          'vue-core':    ['vue', 'vue-router', 'pinia'],
          // Heavy 3D / animation (only used on home)
          'three-gsap':  ['three', 'gsap'],
          // Charts (only used in admin)
          'charts':      ['chart.js', 'vue-chartjs'],
          // Icon lib
          'lucide':      ['lucide-vue-next'],
        }
      }
    },
    // Warn at 600kB, error at 1MB
    chunkSizeWarningLimit: 600,
  }
})
