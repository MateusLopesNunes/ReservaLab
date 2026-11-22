import { spawn } from 'node:child_process'
import { config } from 'dotenv'

config({ path: '.env', quiet: true })
const child = spawn('npm', ['run', 'dev:apps'], { stdio: 'inherit', env: process.env })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('error', () => { console.error('Não foi possível iniciar a aplicação.'); process.exitCode = 1 })
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0) })
