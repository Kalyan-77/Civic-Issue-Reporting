import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'recharts'],
          map: ['mapbox-gl'],
          utils: ['axios', 'socket.io-client']
        }
      }
    },
    // Disable source maps for production to keep builds smaller; enable if you need prod debugging
    sourcemap: false,
    // Minify
    minify: 'esbuild',
  }
})

