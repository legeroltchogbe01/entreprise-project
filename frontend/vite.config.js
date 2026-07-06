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
  }
})
