import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  base: command === 'build' ? '/admin/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/product-images': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
}))