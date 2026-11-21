import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.test.ts', 'src/**/types/**', 'src/main.ts'],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
    }
  }
}))
