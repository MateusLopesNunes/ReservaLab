import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { getIsolatedDatabaseUrl } from './testDatabase.js'

if (process.env.RESERVALAB_TEST_MODE !== '1') {
  config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true })
}

const databaseUrlSchema = z.url({ protocol: /^postgres(?:ql)?$/ })

export function getDatabaseUrl(): string {
  if (process.env.RESERVALAB_TEST_MODE === '1') return getIsolatedDatabaseUrl()

  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL)
  if (!result.success) throw new Error('DATABASE_URL deve conter uma URL PostgreSQL válida')
  return result.data
}
