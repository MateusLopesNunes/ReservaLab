import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/db/client.ts'

try {
  const path = fileURLToPath(new URL('../drizzle/seeds/0001_profile_options.sql', import.meta.url))
  await pool.query(await readFile(path, 'utf8'))
  console.log('Opções iniciais de cadastro disponíveis.')
} catch {
  console.error('Não foi possível carregar as opções de cadastro. Confira a conexão e as migrações.')
  process.exitCode = 1
} finally {
  await pool.end()
}
