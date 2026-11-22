import app from './app.js'
import { pool } from './db/client.js'
import { validateAuthConfig } from './modules/auth/authConfig.js'

const port = Number(process.env.PORT ?? 3000)

validateAuthConfig()

const server = app.listen(port, '127.0.0.1', () => {
  const address = server.address()
  if (address && typeof address !== 'string') console.log(`API disponível na porta ${address.port}`)
})

let shuttingDown = false

function shutdown(): void {
  if (shuttingDown) return
  shuttingDown = true
  const timeout = setTimeout(() => process.exit(1), 10_000)
  timeout.unref()
  server.close(async (error) => {
    if (error) process.exitCode = 1
    try {
      await pool.end()
    } catch {
      process.exitCode = 1
    } finally {
      clearTimeout(timeout)
    }
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
