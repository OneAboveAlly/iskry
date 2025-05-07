import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    include: ['@ckeditor/ckeditor5-react', '@ckeditor/ckeditor5-build-classic'],
    exclude: []
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    commonjsOptions: {
      include: [
        /node_modules/
      ]
    }
  }
}) 