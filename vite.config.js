import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, './src/background.js'),
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        entryFileNames: assetInfo => {
          if (assetInfo.name === 'background') return 'background.js'; // ✅ name it correctly
          return '[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
