import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCommonjs(), // Handle CommonJS modules like @ricky0123/vad-web
  ],
  build: {
    outDir: '../client-dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  server: {
    port: 8031,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['../shared'],
    // Exclude onnxruntime-web from optimization to avoid WASM loading issues
    exclude: ['onnxruntime-web', '@ricky0123/vad-web'],
  },
  // Include WASM and ONNX files as assets
  assetsInclude: ['**/*.wasm', '**/*.onnx'],
})
