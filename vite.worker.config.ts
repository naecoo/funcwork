import { defineConfig } from 'vite'

// Pre-builds the worker script as a self-contained IIFE string,
// consumed by the library build via the __WORKER_SCRIPT__ define.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/worker.ts',
      formats: ['iife'],
      fileName: () => 'worker.iife.js',
      name: '__funcwork_worker__',
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    target: 'es2018',
  },
})
