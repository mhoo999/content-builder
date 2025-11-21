import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import exportSubjectsPlugin from './vite-plugin-export.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), exportSubjectsPlugin()],
  optimizeDeps: {
    include: [
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-underline',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-table-header',
    ],
  },
})
