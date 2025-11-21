import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import exportSubjectsPlugin from './vite-plugin-export.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), exportSubjectsPlugin()],
})
