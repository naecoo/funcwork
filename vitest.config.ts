import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __WORKER_SCRIPT__: '"mock worker script content"',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
