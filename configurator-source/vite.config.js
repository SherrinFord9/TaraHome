import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  base: '/',
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: '.build', emptyOutDir: true, manifest: true,
    rollupOptions: {input: {configurator: fileURLToPath(new URL('./src/configurator.tsx', import.meta.url))}},
  },
});
