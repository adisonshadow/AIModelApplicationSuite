import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  build: {
    outDir: '../../examples-dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
})
