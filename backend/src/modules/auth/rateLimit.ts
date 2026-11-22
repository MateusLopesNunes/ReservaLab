import type { RequestHandler } from 'express'
import { authErrorResponse } from './authHttp.js'

const minuteMs = 60_000
const maxClients = 2048
type Counter = { attempts: number; resetsAt: number }

export function createAttemptLimit(attemptLimit: number) {
  const entries = new Map<string, Counter>()
  return function canAttempt(client: string, now = Date.now()): boolean {
    const entry = entries.get(client)
    if (entry && entry.resetsAt > now) {
      if (entry.attempts >= attemptLimit) return false
      entry.attempts += 1
      return true
    }

    if (entries.size >= maxClients) {
      for (const [key, counter] of entries) {
        if (counter.resetsAt <= now) entries.delete(key)
      }
    }
    if (entries.size >= maxClients) return false
    entries.set(client, { attempts: 1, resetsAt: now + minuteMs })
    return true
  }
}

export function limitAttempts(attemptLimit: number): RequestHandler {
  const canAttempt = createAttemptLimit(attemptLimit)
  return (request, response, next) => {
    const client = request.ip ?? request.socket.remoteAddress ?? 'unknown'
    if (canAttempt(client)) return next()
    response.set('Retry-After', String(minuteMs / 1000))
    authErrorResponse(response, 429, { code: 'AUTH_RATE_LIMIT', message: 'Muitas tentativas. Tente novamente em instantes.' })
  }
}
