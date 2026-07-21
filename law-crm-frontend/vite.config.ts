import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 기존 오타 수정
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})