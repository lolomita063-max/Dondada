import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CoreforgeChatbot',
      formats: ['iife', 'es'],
      fileName: (format) => `coreforge-chatbot.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: 'esbuild',
    cssCodeSplit: false,
  },
});
