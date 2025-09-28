import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '.'),
  resolve: {
    alias: {
      'ai-model-application-suite': path.resolve(__dirname, '../packages/ai_model_application_suite/dist/index.es.js')
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
