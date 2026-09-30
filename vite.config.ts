import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { diskSave } from './vite-plugins/diskSave.ts'

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), diskSave()],
  // The published site lives at https://baranov-ivan-vasilyevich.github.io/internship-tracker/,
  // so the build uses that folder. `npm run dev` stays at http://localhost:5173/.
  base: command === 'build' ? '/internship-tracker/' : '/',
  // Always use port 5173. Saved data belongs to the exact address (localhost:5173),
  // so a different port would look like an empty app.
  server: { port: 5173, strictPort: true },
}))
