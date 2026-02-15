import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true
    },
    esbuild: {
      // Strip console.log/debug/info and debugger in production builds
      ...(isProduction && {
        drop: ['debugger'],
        pure: ['console.log', 'console.debug', 'console.info'],
      }),
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? 'hidden' : true,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query', 'zustand', 'axios'],
            'vendor-pdf': ['@react-pdf/renderer'],
            'vendor-pdfjs': ['pdfjs-dist'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
