import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:net'
import { readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}

function run(command, args, env) {
  return execFileSync(command, args, { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function envText(values) {
  return Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n'
}

async function main() {
  try {
    await readFile('.env')
    throw new Error('Já existe um .env nesta worktree. A configuração existente foi preservada.')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const project = `reservalab-wt-${randomBytes(8).toString('hex')}`
  const password = randomBytes(24).toString('base64url')
  const apiPort = await availablePort()
  let webPort = await availablePort()
  while (webPort === apiPort) webPort = await availablePort()
  const values = {
    COMPOSE_PROJECT_NAME: project, POSTGRES_USER: 'reservalab', POSTGRES_PASSWORD: password,
    POSTGRES_DB: 'reservalab', POSTGRES_PORT: '0',
    AUTH_JWT_SECRET: randomBytes(32).toString('base64url'),
    AUTH_ALLOWED_ORIGIN: `http://127.0.0.1:${webPort}`, AUTH_ALLOW_INSECURE_LOOPBACK: 'true',
    PORT: apiPort, VITE_PORT: webPort, API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`
  }
  await writeFile('.env', envText(values), { flag: 'wx', mode: 0o600 })
  const env = { ...process.env }
  for (const key of [...Object.keys(values), 'DATABASE_URL', 'COMPOSE_FILE', 'COMPOSE_ENV_FILES']) delete env[key]
  try {
    console.log('Instalando dependências...')
    run('npm', ['ci', '--no-audit', '--no-fund'], env)
    console.log('Iniciando PostgreSQL isolado...')
    run('docker', ['compose', '-p', project, 'up', '-d'], env)
    const mapping = run('docker', ['compose', '-p', project, 'port', 'postgres', '5432'], env)
    const match = /^127\.0\.0\.1:(\d+)$/.exec(mapping)
    if (!match || ['5432', '5433'].includes(match[1])) throw new Error('Porta isolada do PostgreSQL não encontrada.')
    values.POSTGRES_PORT = match[1]
    values.DATABASE_URL = `postgresql://reservalab:${password}@127.0.0.1:${match[1]}/reservalab`
    await writeFile('.env', envText(values), { mode: 0o600 })
    for (let attempt = 0; ; attempt++) {
      try {
        run('docker', ['compose', '-p', project, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'reservalab', '-d', 'reservalab'], env)
        break
      } catch {
        if (attempt === 29) throw new Error('O PostgreSQL isolado não ficou disponível.')
        await delay(1000)
      }
    }
    run('npm', ['run', 'db:migrate'], { ...env, DATABASE_URL: values.DATABASE_URL })
    console.log(`Ambiente pronto. Execute npm run dev e acesse http://127.0.0.1:${webPort}`)
  } catch (error) {
    console.error('Preparação incompleta. O .env e o banco isolado foram preservados para diagnóstico.')
    throw new Error(error.message.split('\n')[0])
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
