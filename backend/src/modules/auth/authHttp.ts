import type { Request, RequestHandler, Response } from 'express'
import type { ZodError } from 'zod'
import { AuthError } from './services/authError.js'
import { HashLimitError } from './services/hashLimit.js'

type Handler = (request: Request, response: Response) => void | Promise<void>
type ErrorBody = { code: string; message: string; fields?: string[] }

export function authErrorResponse(response: Response, status: number, body: ErrorBody): void {
  response.status(status).json(body)
}

export function invalidInput(response: Response, error: ZodError): void {
  const fields = [...new Set(error.issues.flatMap(issue => issue.path.slice(0, 1).map(String)))]
  const body: ErrorBody = { code: 'INVALID_INPUT', message: 'Confira os dados informados.', fields }
  response.status(400).json(body)
}

export function returnAuthFailure(response: Response, error: unknown): void {
  if (error instanceof AuthError) {
    authErrorResponse(response, error.status, { code: error.code, message: error.message })
  } else if (error instanceof HashLimitError) {
    response.set('Retry-After', '1')
    authErrorResponse(response, 429, { code: 'AUTH_RATE_LIMIT', message: 'Muitas tentativas. Tente novamente em instantes.' })
  } else {
    authErrorResponse(response, 500, { code: 'INTERNAL_ERROR', message: 'Não foi possível tratar a solicitação.' })
  }
}

export function authHandler(handler: Handler): RequestHandler {
  return async (request, response) => {
    try {
      await handler(request, response)
    } catch (error) {
      returnAuthFailure(response, error)
    }
  }
}
