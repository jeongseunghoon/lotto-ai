import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lotto-api': {
        target: 'https://www.dhlottery.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lotto-api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
