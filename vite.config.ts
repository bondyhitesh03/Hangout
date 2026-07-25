import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Hangout/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
