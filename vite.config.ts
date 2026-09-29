import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative paths so the built site works from any folder (needed for GitHub Pages)
  base: './',
  // Always use port 5173. Saved data belongs to the exact address (localhost:5173),
  // so a different port would look like an empty app.
  server: { port: 5173, strictPort: true },
})
