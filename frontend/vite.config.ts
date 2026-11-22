import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    ...(process.env.VITE_PORT ? { port: Number(process.env.VITE_PORT), strictPort: true } : {}),
    ...(process.env.AUTH_ALLOW_INSECURE_LOOPBACK === 'true' ? { host: '127.0.0.1' } : {}),
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
