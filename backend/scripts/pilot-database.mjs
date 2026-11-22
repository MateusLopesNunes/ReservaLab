import { execFile, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const exec = promisify(execFile)
const root = fileURLToPath(new URL('../../', import.meta.url))
const token = randomBytes(6).toString('hex')
const project = `reservalab-test-${token}`
const database = `reservalab_test_${token}`
const username = 'reservalab_test'
const password = randomBytes(24).toString('base64url')
const composeKeys = ['POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'POSTGRES_PORT',
  'COMPOSE_ENV_FILES', 'COMPOSE_FILE', 'COMPOSE_PROJECT_NAME']
const composeEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !composeKeys.includes(key)))

function run(command, args, env) {
  const child = spawn(command, args, { cwd: root, env, stdio: 'inherit', detached: true })
  function interrupt() {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      process.kill(-child.pid, 'SIGTERM')
    }
  }

  return new Promise((resolve, reject) => {
    process.once('SIGINT', interrupt)
    process.once('SIGTERM', interrupt)
    child.once('error', reject)
    child.once('close', code => code === 0 ? resolve() : reject(new Error(`${command} falhou no ambiente isolado.`)))
  }).finally(() => {
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
  })
}

async function validateDatabase(connectionString) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const client = new pg.Client({ connectionString, connectionTimeoutMillis: 1000 })
    let result
    try {
      await client.connect()
      result = await client.query('select current_database() as database, current_user as username')
    } catch {
      await delay(500)
    } finally {
      await client.end()
    }
    if (!result) continue
    if (result.rows[0]?.database !== database || result.rows[0]?.username !== username) {
      throw new Error('A identidade do PostgreSQL não corresponde ao banco isolado.')
    }
    return
  }
  throw new Error('O PostgreSQL isolado não ficou disponível.')
}

function testEnvironment(port) {
  const url = `postgresql://${username}:${password}@127.0.0.1:${port}/${database}`
  return {
    ...process.env,
    DATABASE_URL: url,
    TEST_DATABASE_URL: url,
    RESERVALAB_TEST_MODE: '1',
    RESERVALAB_TEST_DATABASE_NAME: database,
    RESERVALAB_TEST_DATABASE_PORT: port,
    AUTH_JWT_SECRET: randomBytes(32).toString('base64url'),
    AUTH_ALLOWED_ORIGIN: process.env.AUTH_ALLOWED_ORIGIN || 'http://127.0.0.1:5173',
    AUTH_ALLOW_INSECURE_LOOPBACK: 'true'
  }
}

async function seedExistingEquipment(directory, env) {
  const initial = join(directory, 'initial-migration')
  await mkdir(join(initial, 'meta'), { recursive: true })
  const migrations = join(root, 'backend', 'drizzle')
  const journal = JSON.parse(await readFile(join(migrations, 'meta', '_journal.json'), 'utf8'))
  const [entry] = journal.entries
  await copyFile(join(migrations, `${entry.tag}.sql`), join(initial, `${entry.tag}.sql`))
  await writeFile(join(initial, 'meta', '_journal.json'), JSON.stringify({ ...journal, entries: [entry] }))
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
  try {
    await migrate(drizzle(pool), { migrationsFolder: initial })
    await pool.query('insert into equipment (name) values ($1)', ['Equipamento da base anterior'])
  } finally {
    await pool.end()
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args[0] === '--') args.shift()
  const existingEquipment = args[0] === '--with-existing-equipment'
  if (existingEquipment) args.shift()
  if (args[0] === '--') args.shift()
  const legacyProfiles = args[0] === '--verify-profile-migration'
  if (legacyProfiles) args.shift()
  if (args[0] === '--') args.shift()
  if (!args.length) args.push('npm', 'run', 'test:integration', '-w', 'backend')

  const dir = await mkdtemp(join(tmpdir(), 'reservalab-pilot-'))
  const envFile = join(dir, 'test.env')
  const baseArgs = ['compose', '--project-directory', dir, '--env-file', envFile, '-p', project,
    '-f', join(root, 'compose.yaml')]
  const compose = (...command) => exec('docker', [...baseArgs, ...command], { env: composeEnv, timeout: 30_000 })
  await writeFile(envFile, `POSTGRES_USER=${username}\nPOSTGRES_PASSWORD=${password}\nPOSTGRES_DB=${database}\nPOSTGRES_PORT=0\n`, { mode: 0o600 })
  try {
    await compose('up', '-d')
    const { stdout } = await compose('port', 'postgres', '5432')
    const port = /^127\.0\.0\.1:(\d+)$/.exec(stdout.trim())?.[1]
    if (!port || Number(port) < 1024 || ['5432', '5433'].includes(port)) {
      throw new Error('O PostgreSQL não obteve uma porta de teste em loopback.')
    }
    const env = testEnvironment(port)
    await validateDatabase(env.DATABASE_URL)
    if (existingEquipment) {
      await seedExistingEquipment(dir, env)
      env.RESERVALAB_TEST_LEGACY_EQUIPMENT = '1'
    }
    if (legacyProfiles) await run('node', ['--import', 'tsx', 'backend/scripts/test-profile-migration.mjs'], env)
    await run('npm', ['run', 'db:migrate'], env)
    await run(args[0], args.slice(1), env)
  } finally {
    try {
      await compose('down', '--volumes', '--remove-orphans')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(error?.cmd ? 'Falha ao preparar ou remover o PostgreSQL de testes no Docker.' : error.message)
  process.exitCode = 1
}
