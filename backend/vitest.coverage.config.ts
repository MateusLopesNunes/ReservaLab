import { configDefaults, defineConfig } from 'vitest/config'
import { getIsolatedDatabaseUrl } from './src/config/testDatabase.js'
import unitConfig from './vitest.config.js'

getIsolatedDatabaseUrl()

export default defineConfig({
  ...unitConfig,
  test: {
    ...unitConfig.test,
    include: ['src/**/*.test.ts'],
    exclude: configDefaults.exclude,
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000
  }
})
