import { sql } from 'drizzle-orm'
import { db, pool } from './client.js'

try {
  await db.execute(sql`select 1`)
  console.log('Conexão com o PostgreSQL estabelecida.')
} catch {
  console.error('Não foi possível conectar ao PostgreSQL. Confira o banco e a configuração.')
  process.exitCode = 1
} finally {
  await pool.end()
}
