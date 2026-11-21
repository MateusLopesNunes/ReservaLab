import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true })

const databaseUrlSchema = z.url({ protocol: /^postgres(?:ql)?$/ })

export function getDatabaseUrl(): string {
  const result = databaseUrlSchema.safeParse(process.env.DATABASE_URL)
  if (!result.success) throw new Error('DATABASE_URL deve conter uma URL PostgreSQL válida')
  return result.data
}
