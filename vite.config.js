import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      timeout: 5000,
    },
    host: '127.0.0.1',
    port: 3000,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    /*  alias: {
      '@': path.resolve(__dirname, './src'),
    }, */
  }
});