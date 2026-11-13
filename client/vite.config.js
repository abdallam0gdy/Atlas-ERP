import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'strip-crossorigin-from-assets',
      transformIndexHtml(html) {
        // Strip crossorigin from link tags (especially stylesheets) to prevent Edge CORS blocking on local LAN IPs
        return html
          .replace(/<link([^>]*?)\s+crossorigin\b([^>]*?)>/gi, '<link$1$2>')
          .replace(/<script([^>]*?)\s+crossorigin\b([^>]*?)>/gi, '<script$1$2>');
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-query';
          }
        },
      },
    },
  },
})

