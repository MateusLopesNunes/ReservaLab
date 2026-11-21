import app from './app.js'
import { pool } from './db/client.js'

const port = Number(process.env.PORT ?? 3000)

const server = app.listen(port, () => {
  console.log(`API disponível em http://localhost:${port}`)
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
