import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  optimizeDeps: {
    exclude: ['ai_model_application_suite']
  },
  build: {
    outDir: '../../examples-dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['ai_model_application_suite']
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
