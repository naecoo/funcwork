import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const workerScript = JSON.stringify(
  readFileSync(resolve(import.meta.dirname, 'dist/worker.iife.js'), 'utf-8'),
)

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.app.json',
      include: ['src'],
    }),
  ],
  define: {
    __WORKER_SCRIPT__: workerScript,
  },
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'FuncWork',
      formats: ['es', 'cjs', 'iife'],
      fileName: format => (format === 'es' ? 'index.js' : format === 'cjs' ? 'index.cjs' : 'index.iife.js'),
    },
    sourcemap: true,
    minify: true,
    target: 'es2018',
  },
})
