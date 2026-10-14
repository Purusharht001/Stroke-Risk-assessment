import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend runs in WSL on :8000 with no CORS. 127.0.0.1, not localhost: on Windows
// localhost resolves to ::1 first and the WSL-mirrored port only answers on IPv4.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
