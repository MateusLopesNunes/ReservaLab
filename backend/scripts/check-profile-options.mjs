import { pool } from '../src/db/client.ts'

const normalize = (column) => `translate(lower(trim(${column})),
  'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')`

try {
  const result = await pool.query(`
    SELECT id, ${normalize('state')} IN ('go', 'goias') AS state_ok,
      ${normalize('city')} IN ('ceres', 'rialma') AS city_ok,
      ${normalize('sex')} IN ('feminino', 'masculino', 'intersexo', 'outro', 'prefiro nao informar') AS sex_ok
    FROM user_account
    WHERE ${normalize('state')} NOT IN ('go', 'goias')
       OR ${normalize('city')} NOT IN ('ceres', 'rialma')
       OR ${normalize('sex')} NOT IN ('feminino', 'masculino', 'intersexo', 'outro', 'prefiro nao informar')
    ORDER BY id
  `)
  console.log(`Contas que precisam de correção: ${result.rowCount}`)
  for (const row of result.rows) {
    const fields = [!row.state_ok && 'estado', !row.city_ok && 'cidade', !row.sex_ok && 'sexo'].filter(Boolean)
    console.log(`ID ${row.id}: ${fields.join(', ')}`)
  }
} catch {
  console.error('Não foi possível diagnosticar. Confira se o banco usa o esquema anterior à migração.')
  process.exitCode = 1
} finally {
  await pool.end()
}
