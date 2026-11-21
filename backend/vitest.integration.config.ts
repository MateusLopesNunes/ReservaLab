import { defineConfig } from 'vitest/config'
import { getIsolatedDatabaseUrl } from './src/config/testDatabase.js'

getIsolatedDatabaseUrl()

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000
  }
})
