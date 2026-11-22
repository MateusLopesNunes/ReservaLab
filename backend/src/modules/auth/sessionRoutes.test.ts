import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app, cookie, credentials, origin, session, sessionId, setAuthEnv, userId } from './test/authRoutes.fixture.js'
import { findAccountCredentials } from './data/accountRepository.js'
import { rotateRefresh } from './data/refreshRepository.js'
import { endSession, startSession } from './data/sessionRepository.js'
import { identifyBearer } from './services/accessToken.js'
import { digestRefreshSecret } from './services/refreshSecret.js'
import { verifyPassword } from './services/password.js'

beforeEach(() => {
  vi.resetAllMocks()
  setAuthEnv()
})
afterEach(() => vi.unstubAllEnvs())

describe('rotas de sessão', () => {
  it.each(['login', 'refresh', 'logout'])('bloqueia %s sem origem esperada', async route => {
    const absent = await request(app).post(`/api/auth/${route}`).send({})
    expect(absent.status).toBe(403)
    const different = await request(app).post(`/api/auth/${route}`).set('Origin', 'https://different.test').send({})
    expect(different.status).toBe(403)
    expect(startSession).not.toHaveBeenCalled()
    expect(rotateRefresh).not.toHaveBeenCalled()
    expect(endSession).not.toHaveBeenCalled()
  })

  it('emite JWT e entrega refresh exclusivamente no cookie seguro', async () => {
    vi.mocked(findAccountCredentials).mockResolvedValue({ userId, passwordHash: 'hash-realizado' })
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(startSession).mockResolvedValue(session)
    const response = await request(app).post('/api/auth/login').set('Origin', origin)
      .set('Cookie', cookie).send(credentials)
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ userId, sessionId, accessToken: expect.any(String), expiresIn: 900 })
    expect(response.headers['cache-control']).toBe('no-store')
    const setCookie = String(response.headers['set-cookie'])
    expect(setCookie).toMatch(/^reservalab_refresh=[\w-]{43};.*Path=\/api\/auth/)
    expect(setCookie).toContain('HttpOnly; Secure; SameSite=Lax')
    expect(setCookie).not.toContain('Domain=')
    await expect(identifyBearer(`Bearer ${response.body.accessToken}`)).resolves.toEqual({ userId, sessionId })
    expect(startSession).toHaveBeenCalledWith(expect.objectContaining({
      userId, digest: expect.stringMatching(/^[a-f0-9]{64}$/), previousDigest: digestRefreshSecret('a'.repeat(43))
    }))
  })

  it('recusa credencial inválida genericamente', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false)
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send(credentials)
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('INVALID_CREDENTIALS')
    expect(startSession).not.toHaveBeenCalled()
  })

  it('renova na mesma sessão e troca o cookie', async () => {
    vi.mocked(rotateRefresh).mockResolvedValue(session)
    const response = await request(app).post('/api/auth/refresh').set('Origin', origin)
      .set('Cookie', cookie).send({ sessionId })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ userId, sessionId, expiresIn: 900 })
    expect(String(response.headers['set-cookie'])).not.toContain(cookie)
    expect(rotateRefresh).toHaveBeenCalledWith(expect.objectContaining({ expectedSessionId: sessionId }))
  })

  it('recusa refresh inválido sem trocar cookie', async () => {
    vi.mocked(rotateRefresh).mockResolvedValue(null)
    const response = await request(app).post('/api/auth/refresh').set('Origin', origin)
      .set('Cookie', cookie).send({ sessionId })
    expect(response.status).toBe(401)
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('recusa cabeçalho com cookies duplicados sem tentar renovação', async () => {
    const response = await request(app).post('/api/auth/refresh').set('Origin', origin)
      .set('Cookie', `${cookie}; ${cookie}`).send({})
    expect(response.status).toBe(401)
    expect(rotateRefresh).not.toHaveBeenCalled()
  })

  it.each([true, false])('logout tem 204 e só limpa cookie correspondente %s', async clear => {
    vi.mocked(endSession).mockResolvedValue(clear)
    const response = await request(app).post('/api/auth/logout').set('Origin', origin)
      .set('Cookie', cookie).send({ sessionId })
    expect(response.status).toBe(204)
    if (clear) expect(String(response.headers['set-cookie'])).toContain('reservalab_refresh=;')
    else expect(response.headers['set-cookie']).toBeUndefined()
  })
})
