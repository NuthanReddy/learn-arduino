import { defineConfig } from 'vite';

export default defineConfig({
  base: '/learn-arduino/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
