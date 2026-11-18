import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el build funciona en GitHub Pages o abriéndolo desde cualquier carpeta
export default defineConfig({
  plugins: [react()],
  base: './',
});
