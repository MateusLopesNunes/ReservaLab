import type { RequestHandler } from 'express'
import { authErrorResponse, returnAuthFailure } from './authHttp.js'
import { sessionIsActive } from './data/sessionRepository.js'
import { identifyBearer } from './services/accessToken.js'

export const requireAuthentication: RequestHandler = async (request, response, next) => {
  try {
    const identity = await identifyBearer(request.get('Authorization'))
    if (!identity || !(await sessionIsActive(identity))) {
      authErrorResponse(response, 401, { code: 'AUTH_REQUIRED', message: 'Entre para continuar.' })
      return
    }

    response.locals.auth = identity
    next()
  } catch (error) {
    returnAuthFailure(response, error)
  }
}
