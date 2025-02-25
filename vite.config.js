import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      external: ['electron', 'os', 'fs', 'path', 'events', 'child_process', 'crypto', 'http', 'buffer', 'url', 'stream']
    }
  },
  resolve: {
    alias: {
      'recharts': 'recharts/es6'
    }
  }
}) 