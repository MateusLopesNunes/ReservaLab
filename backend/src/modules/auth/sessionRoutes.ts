import type { RequestHandler } from 'express'
import { validateAuthConfig } from './authConfig.js'
import { authErrorResponse, authHandler, invalidInput, returnAuthFailure } from './authHttp.js'
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './cookies.js'
import { credentialsSchema, sessionInputSchema } from './schemas/credentials.js'
import { identifyCredentials } from './services/account.js'
import { logIn, logOut, renewSession } from './services/session.js'

export const requireSessionOrigin: RequestHandler = (request, response, next) => {
  try {
    if (request.get('Origin') !== validateAuthConfig().origin) {
      return authErrorResponse(response, 403, { code: 'INVALID_ORIGIN', message: 'Origem não autorizada.' })
    }
    next()
  } catch (error) {
    returnAuthFailure(response, error)
  }
}

export const loginRoute = authHandler(async (request, response) => {
  const input = credentialsSchema.safeParse(request.body)
  if (!input.success) return invalidInput(response, input.error)
  const userId = await identifyCredentials(input.data)
  const session = await logIn(userId, readRefreshCookie(request))
  setRefreshCookie(response, session.refresh, session.expiresAt)
  response.json(session.body)
})

export const refreshRoute = authHandler(async (request, response) => {
  const input = sessionInputSchema.safeParse(request.body ?? {})
  if (!input.success) return invalidInput(response, input.error)
  const session = await renewSession(readRefreshCookie(request), input.data.sessionId)
  setRefreshCookie(response, session.refresh, session.expiresAt)
  response.json(session.body)
})

export const logoutRoute = authHandler(async (request, response) => {
  const input = sessionInputSchema.safeParse(request.body ?? {})
  if (!input.success) return invalidInput(response, input.error)
  const clearCookie = await logOut(request.get('Authorization'), readRefreshCookie(request), input.data.sessionId)
  if (clearCookie) clearRefreshCookie(response)
  response.status(204).end()
})
