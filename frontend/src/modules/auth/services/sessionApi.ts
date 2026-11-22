import {
  apiErrorSchema,
  loginSchema,
  registeredAccountSchema,
  registrationSchema,
  sessionSchema,
  type LoginInput,
  type RegistrationInput,
  type Session
} from '../schemas/authSchema'

export class AuthApiError extends Error {}

export async function readApiError(response: Response) {
  const body: unknown = await response.clone().json().catch(() => null)
  const parsed = apiErrorSchema.safeParse(body)
  return parsed.success ? parsed.data : null
}

async function postAuth(action: string, body: object, token?: string): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (token) headers.set('Authorization', 'Bearer ' + token)
  return fetch('/api/auth/' + action, {
    method: 'POST',
    credentials: 'same-origin',
    redirect: 'error',
    headers,
    body: JSON.stringify(body)
  })
}

async function failure(response: Response, fallback: string): Promise<Error> {
  const error = await readApiError(response)
  return new AuthApiError(response.status < 500 && error ? error.message : fallback)
}

export async function submitRegistration(input: RegistrationInput): Promise<void> {
  const response = await postAuth('register', registrationSchema.parse(input))
  if (!response.ok) throw await failure(response, 'Não foi possível criar sua conta.')
  registeredAccountSchema.parse(await response.json())
}

export async function requestLogin(input: LoginInput): Promise<Session> {
  const response = await postAuth('login', loginSchema.parse(input))
  if (!response.ok) throw await failure(response, 'Não foi possível entrar.')
  return sessionSchema.parse(await response.json())
}

export async function requestRefresh(sessionId?: string): Promise<Session | null> {
  const response = await postAuth('refresh', sessionId ? { sessionId } : {})
  if (response.status === 401) return null
  if (!response.ok) throw await failure(response, 'Não foi possível verificar sua sessão.')
  return sessionSchema.parse(await response.json())
}

export async function requestLogout(session: Session): Promise<void> {
  const response = await postAuth('logout', { sessionId: session.sessionId }, session.accessToken)
  if (!response.ok) throw await failure(response, 'Não foi possível sair da conta.')
}
