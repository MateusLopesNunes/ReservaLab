import { strict as assert } from 'node:assert'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { getIsolatedDatabaseUrl } from '../src/config/testDatabase.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const url = getIsolatedDatabaseUrl()
const temporary = await mkdtemp(join(tmpdir(), 'reservalab-legacy-'))
const folder = join(temporary, 'migrations')
const existing = join(root, 'backend', 'drizzle')
const pool = new pg.Pool({ connectionString: url })

try {
  await mkdir(join(folder, 'meta'), { recursive: true })
  const journal = JSON.parse(await readFile(join(existing, 'meta', '_journal.json'), 'utf8'))
  const entries = journal.entries.filter(entry => entry.idx < 3)
  assert.equal(entries.length, 3)
  for (const entry of entries) await copyFile(join(existing, entry.tag + '.sql'), join(folder, entry.tag + '.sql'))
  await writeFile(join(folder, 'meta', '_journal.json'), JSON.stringify({ ...journal, entries }))
  const db = drizzle(pool)
  await migrate(db, { migrationsFolder: folder })
  await pool.query(`insert into user_account (email, password_hash, first_name, last_name, state, city, birth_date, sex)
    values ('valido@example.test', 'hash', 'Pessoa', 'Teste', '  Goiás  ', ' Ceres ', '1990-01-01', ' Feminino '),
    ('pendente@example.test', 'hash', 'Outra', 'Pessoa', 'SP', 'São Paulo', '1991-01-01', 'Feminino')`)
  let rejected = false
  try {
    await migrate(db, { migrationsFolder: existing })
  } catch {
    rejected = true
  }
  assert.equal(rejected, true, 'Migração deveria recusar dados antigos sem correspondência.')
  const before = await pool.query('select email, state, city, sex from user_account order by email')
  assert.equal(before.rowCount, 2)
  assert.equal(before.rows[0].state, 'SP')
  assert.equal(before.rows[1].state, '  Goiás  ')
  assert.equal((await pool.query("select to_regclass('public.city') as value")).rows[0].value, null)
  await pool.query("update user_account set state = 'GO', city = 'Rialma', sex = 'Outro' where email = 'pendente@example.test'")
  await migrate(db, { migrationsFolder: existing })
  const after = await pool.query(`select u.email, s.name as state, c.name as city, o.label as sex
    from user_account u join state s on s.code = u.state
    join city c on c.id = u.city and c.state_code = u.state
    join sex_option o on o.code = u.sex order by u.email`)
  assert.deepEqual(after.rows, [
    { email: 'pendente@example.test', state: 'Goiás', city: 'Rialma', sex: 'Outro' },
    { email: 'valido@example.test', state: 'Goiás', city: 'Ceres', sex: 'Feminino' }
  ])
  console.log('Migração legada validada: rollback sem perda e reexecução após correção.')
} finally {
  await pool.end()
  await rm(temporary, { recursive: true, force: true })
}
