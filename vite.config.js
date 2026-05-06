import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'mui': ['@mui/material', '@mui/icons-material'],
          'datagrid': ['@mui/x-data-grid'],
          'charts': ['recharts'],
          'pdf': ['jspdf', 'jspdf-autotable'],
          'excel': ['xlsx']
        }
      }
    }
  }
})
