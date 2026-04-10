import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/tp-booking/',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://technopark.kmutnb.ac.th/tp-booking',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4025',
        changeOrigin: true,
      },
    },
  },
})
