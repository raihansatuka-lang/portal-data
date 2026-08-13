import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Naikkan limit warning chunk (default 500 kB terlalu rendah untuk leaflet)
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // ── Manual chunk splitting ──────────────────────────────────────────
        // Memecah bundle besar menjadi potongan-potongan kecil yang bisa
        // di-cache browser secara terpisah. Saat kode app berubah, library
        // chunk (leaflet, recharts, dll) tidak perlu didownload ulang.
        manualChunks: (id) => {
          // 1. Leaflet + react-leaflet → chunk terpisah (besar, jarang berubah)
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'vendor-leaflet'
          }

          // 2. Chart libraries (chart.js, recharts, apexcharts) → 1 chunk
          if (
            id.includes('recharts') ||
            id.includes('chart.js') ||
            id.includes('react-chartjs-2') ||
            id.includes('react-apexcharts') ||
            id.includes('apexcharts')
          ) {
            return 'vendor-charts'
          }

          // 3. Framer Motion → chunk terpisah (besar, animasi)
          if (id.includes('framer-motion')) {
            return 'vendor-motion'
          }

          // 5. Semua node_modules lain → vendor-misc
          if (id.includes('node_modules')) {
            return 'vendor-misc'
          }
        },
      },
    },
  },

  // ── Optimasi dev server ──────────────────────────────────────────────────
  // Pre-bundle dependensi besar saat pertama kali dev server jalan
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'leaflet',
      'react-leaflet',
      'axios',
    ],
  },
})
