import { Router } from 'express'
import { authErrorResponse, authHandler, invalidInput } from './authHttp.js'
import { findOwnProfile } from './data/accountRepository.js'
import { limitAttempts } from './rateLimit.js'
import { requireAuthentication } from './requireAuthentication.js'
import { registrationSchema } from './schemas/credentials.js'
import { loginRoute, logoutRoute, refreshRoute, requireSessionOrigin } from './sessionRoutes.js'
import type { AuthIdentity } from './services/accessToken.js'
import { registerAccount } from './services/account.js'

const registrationAttemptsPerMinute = 10
const loginAttemptsPerMinute = 20
export const authRouter: Router = Router()
export { requireAuthentication }

authRouter.use((_request, response, next) => {
  response.set('Cache-Control', 'no-store')
  next()
})

authRouter.post('/register', limitAttempts(registrationAttemptsPerMinute), authHandler(async (request, response) => {
  const input = registrationSchema.safeParse(request.body)
  if (!input.success) return invalidInput(response, input.error)
  const account = await registerAccount(input.data)
  response.status(201).json(account)
}))

authRouter.post('/login', requireSessionOrigin, limitAttempts(loginAttemptsPerMinute), loginRoute)
authRouter.post('/refresh', requireSessionOrigin, refreshRoute)
authRouter.post('/logout', requireSessionOrigin, logoutRoute)

authRouter.get('/me', requireAuthentication, authHandler(async (_request, response) => {
  const identity = response.locals.auth as AuthIdentity
  const profile = await findOwnProfile(identity.userId)
  if (!profile) return authErrorResponse(response, 401, { code: 'AUTH_REQUIRED', message: 'Entre para continuar.' })
  response.json(profile)
}))
