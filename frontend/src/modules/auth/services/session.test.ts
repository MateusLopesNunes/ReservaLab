import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../schemas/authSchema'
import { authenticatedFetch } from './authenticatedFetch'
import { listenForSessionChanges, login, logout, renewSession } from './sessionCoordinator'
import { replaceSession, session } from './sessionState'

const first: Session = {
  accessToken: 'before-refresh',
  expiresIn: 900,
  userId: '1f42696e-fee5-4711-95d8-018773193e32',
  sessionId: 'e1464913-e21b-4d8b-8b06-c29880a2be0b'
}
const renewed = { ...first, accessToken: 'after-refresh' }
const other = {
  ...renewed,
  userId: '4459f6bd-54ee-4d23-8cf0-4d0ff5798360',
  sessionId: '9d1d63ba-ed96-4efb-a456-78d8b416fa41'
}
const fetchMock = vi.fn<typeof fetch>()
const unauthorized = () => Response.json({ code: 'AUTH_REQUIRED', message: 'Sua sessão terminou.' }, { status: 401 })
const authHeader = (options?: RequestInit) => new Headers(options?.headers).get('Authorization')
const options = { method: 'POST', body: '{"startsAt":"future"}' }

beforeEach(() => {
  replaceSession(null)
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('cliente autenticado', () => {
  it('recusa envio de um token sem sessão ou para outro domínio', async () => {
    await expect(authenticatedFetch('/api/equipment')).rejects.toThrow('Sua sessão terminou.')
    replaceSession(first)
    await expect(authenticatedFetch('https://exemplo.com/api/equipment')).rejects.toThrow('destino')
    await expect(authenticatedFetch('/login')).rejects.toThrow('destino')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renova uma vez e repete uma ação para a mesma conta e sessão', async () => {
    replaceSession(first)
    fetchMock.mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json(renewed))
      .mockResolvedValueOnce(Response.json({ saved: true }, { status: 201 }))

    const result = await authenticatedFetch('/api/equipment', options)

    expect(result.status).toBe(201)
    expect(authHeader(fetchMock.mock.calls[0]?.[1])).toBe('Bearer before-refresh')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/auth/refresh')
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(JSON.stringify({ sessionId: first.sessionId }))
    expect(authHeader(fetchMock.mock.calls[2]?.[1])).toBe('Bearer after-refresh')
    expect(fetchMock.mock.calls[2]?.[1]?.body).toBe(options.body)
    expect(session.value?.accessToken).toBe(renewed.accessToken)
  })

  it('compartilha a renovação entre chamadas abertas na mesma aba', async () => {
    replaceSession(first)
    const request = vi.fn(async () => Response.json(renewed))
    fetchMock.mockImplementation(async (path, init) => {
      if (path === '/api/auth/refresh') return request()
      return authHeader(init) === 'Bearer before-refresh' ? unauthorized() : Response.json([])
    })

    await Promise.all([authenticatedFetch('/api/equipment'), authenticatedFetch('/api/equipment')])

    expect(request).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it.each([
    ['a identidade mudou', () => Response.json(other)],
    ['o servidor recusou o refresh', unauthorized]
  ])('descarta a ação sem repetir quando %s', async (_description, refreshResponse) => {
    replaceSession(first)
    fetchMock.mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(refreshResponse())

    await expect(authenticatedFetch('/api/equipment', options)).rejects.toThrow('Sua sessão terminou.')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(session.value).toBeNull()
  })

  it.each([
    ['outro código de 401', () => Response.json({ code: 'OTHER', message: 'Falha de negócio' }, { status: 401 }), 401],
    ['conflito de reserva', () => new Response(null, { status: 409 }), 409],
    ['resposta sem erro estruturado', () => new Response(null, { status: 401 }), 401]
  ])('não renova em resposta de %s', async (_description, respond, status) => {
    replaceSession(first)
    fetchMock.mockResolvedValueOnce(respond())

    await expect(authenticatedFetch('/api/equipment', options)).resolves.toHaveProperty('status', status)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(session.value?.sessionId).toBe(first.sessionId)
  })

  it('não repete falha de transporte', async () => {
    replaceSession(first)
    fetchMock.mockRejectedValueOnce(new TypeError('Falha de rede'))

    await expect(authenticatedFetch('/api/equipment', options)).rejects.toThrow('Falha de rede')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('encerra a sessão se o pedido repetido também receber AUTH_REQUIRED', async () => {
    replaceSession(first)
    fetchMock.mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(Response.json(renewed))
      .mockResolvedValueOnce(unauthorized())

    await expect(authenticatedFetch('/api/equipment')).rejects.toThrow('Sua sessão terminou.')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(session.value).toBeNull()
  })

  it('descarta até resposta bem sucedida se houve saída durante o pedido', async () => {
    replaceSession(first)
    let resolveRequest!: (response: Response) => void
    const pending = new Promise<Response>(resolve => { resolveRequest = resolve })
    fetchMock.mockReturnValueOnce(pending).mockResolvedValueOnce(new Response(null, { status: 204 }))

    const result = authenticatedFetch('/api/equipment', options)
    const assertion = expect(result).rejects.toThrow('Sua sessão terminou.')
    await logout()
    resolveRequest(Response.json({ saved: true }, { status: 201 }))

    await assertion
    const sent = fetchMock.mock.calls[1]
    expect(sent?.[0]).toBe('/api/auth/logout')
    expect(authHeader(sent?.[1])).toBe('Bearer before-refresh')
    expect(sent?.[1]?.body).toBe(JSON.stringify({ sessionId: first.sessionId }))
  })
})

describe('coordenação da sessão', () => {
  it('restaura a conta pelo cookie e coordena pela Web Lock quando disponível', async () => {
    const request = vi.fn(async (_name: string, callback: () => Promise<Session | null>) => callback())
    vi.stubGlobal('navigator', { locks: { request } })
    fetchMock.mockResolvedValueOnce(Response.json(first))

    await expect(renewSession()).resolves.toEqual(first)

    expect(request).toHaveBeenCalledOnce()
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe('{}')
    expect(session.value?.userId).toBe(first.userId)
  })

  it('descarta a sessão anterior quando recebe aviso de troca em outra aba', async () => {
    let receive: ((event: MessageEvent<unknown>) => void) | null = null
    const close = vi.fn()
    vi.stubGlobal('BroadcastChannel', class {
      set onmessage(listener: (event: MessageEvent<unknown>) => void) { receive = listener }
      readonly close = close
    })
    replaceSession(first)
    const disconnect = listenForSessionChanges()

    receive!(new MessageEvent('message', { data: { type: 'login', sessionId: other.sessionId, time: Number.MAX_SAFE_INTEGER } }))
    expect(session.value).toBeNull()

    disconnect()
    expect(close).toHaveBeenCalledOnce()
  })

  it('usa sessão validada do login, sem confiar em DTO incompleto', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ accessToken: 'token' }))
    await expect(login({ email: 'pessoa@example.com', password: 'qualquer' })).rejects.toThrow()
    expect(session.value).toBeNull()
  })
})
