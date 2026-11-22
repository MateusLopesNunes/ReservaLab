import { readApiError } from './sessionApi'
import { renewSession } from './sessionCoordinator'
import { isCurrent, replaceSession, sameSession, snapshotSession, type SessionSnapshot } from './sessionState'

const SESSION_ENDED = 'Sua sessão terminou. Entre novamente.'

function ensureCurrent(snapshot: SessionSnapshot): void {
  if (!isCurrent(snapshot)) throw new Error(SESSION_ENDED)
}

function apiPath(input: string): string {
  const url = new URL(input, window.location.origin)
  if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
    throw new Error('O destino da requisição autenticada é inválido.')
  }
  return url.pathname + url.search
}

async function send(path: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', 'Bearer ' + accessToken)
  return fetch(path, { ...init, headers, credentials: 'same-origin', redirect: 'error' })
}

async function authenticationRequired(response: Response): Promise<boolean> {
  return response.status === 401 && (await readApiError(response))?.code === 'AUTH_REQUIRED'
}

export async function authenticatedFetch(input: string, init?: RequestInit): Promise<Response> {
  const path = apiPath(input)
  const snapshot = snapshotSession()
  if (!snapshot.session) throw new Error(SESSION_ENDED)

  const response = await send(path, snapshot.session.accessToken, init)
  const needsRenewal = await authenticationRequired(response)
  ensureCurrent(snapshot)
  if (!needsRenewal) return response

  const current = snapshotSession().session
  const renewed = current?.accessToken !== snapshot.session.accessToken
    ? current
    : await renewSession(snapshot)
  ensureCurrent(snapshot)
  if (!renewed || !sameSession(snapshot.session, renewed)) throw new Error(SESSION_ENDED)

  const retry = await send(path, renewed.accessToken, init)
  const stillUnauthorized = await authenticationRequired(retry)
  ensureCurrent(snapshot)
  if (stillUnauthorized) {
    replaceSession(null)
    throw new Error(SESSION_ENDED)
  }
  return retry
}
