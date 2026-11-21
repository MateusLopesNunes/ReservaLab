import express, { type ErrorRequestHandler, type Express } from 'express'
import statusRouter from './modules/status/routes.js'
import equipmentRouter from './modules/equipment/routes.js'
import { authRouter, requireAuthentication } from './modules/auth/routes.js'
import { reservationsRouter } from './modules/reservations/routes.js'

const app: Express = express()

const handleRequestError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) return next(error)
  const badJson = error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed'
  const bodyTooLarge = typeof error === 'object' && error !== null && 'type' in error
    && error.type === 'entity.too.large'
  const badPath = error instanceof URIError && 'status' in error && error.status === 400
  if (badJson || badPath || bodyTooLarge) {
    response.status(bodyTooLarge ? 413 : 400).json({
      code: 'INVALID_REQUEST',
      message: badPath ? 'O identificador do recurso é inválido.' : 'O corpo da requisição é inválido.'
    })
    return
  }
  response.status(500).json({ code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a solicitação.' })
}

app.use(express.json())
app.use('/api/status', statusRouter)
app.use('/api/auth', authRouter)
app.use('/api/equipment/:equipmentId/reservations', requireAuthentication, reservationsRouter)
app.use('/api/equipment', requireAuthentication, equipmentRouter)
app.use(handleRequestError)

export default app
