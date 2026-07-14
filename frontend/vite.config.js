import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Toutes les routes inconnues renvoient index.html → React Router gère la navigation
    historyApiFallback: true,
    port: 3000,
    strictPort: true,
  },
  preview: {
    historyApiFallback: true,
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('react')) {
              return 'vendor-react';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
})
