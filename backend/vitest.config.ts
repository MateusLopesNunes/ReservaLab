import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/types/**', 'src/server.ts', 'src/db/check.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
})
