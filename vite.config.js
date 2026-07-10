import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/musou-abyss-guideWeb/',
  plugins: [react()],
});
