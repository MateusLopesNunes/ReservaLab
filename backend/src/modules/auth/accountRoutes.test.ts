import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app, credentials, profile, sessionId, setAuthEnv, userId } from './test/authRoutes.fixture.js'
import { findOwnProfile, insertAccount } from './data/accountRepository.js'
import { sessionIsActive } from './data/sessionRepository.js'
import { signAccessToken } from './services/accessToken.js'
import { HashLimitError } from './services/hashLimit.js'
import { hashPassword } from './services/password.js'

const registration = { ...profile, password: credentials.password }

beforeEach(() => {
  vi.resetAllMocks()
  setAuthEnv()
})
afterEach(() => vi.unstubAllEnvs())

describe('rotas de conta', () => {
  it('cadastra com hash e retorna somente identificador', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hash-realizado')
    vi.mocked(insertAccount).mockResolvedValue(userId)
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ userId })
    expect(response.headers['set-cookie']).toBeUndefined()
    expect(insertAccount).toHaveBeenCalledWith({ ...profile, passwordHash: 'hash-realizado' })
  })

  it('indica campos inválidos sem reproduzir valores de entrada', async () => {
    const response = await request(app).post('/api/auth/register').send({
      ...registration, email: 'valor de entrada sensível'
    })
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ code: 'INVALID_INPUT', fields: ['email'] })
    expect(response.text).not.toContain('valor de entrada sensível')
    expect(hashPassword).not.toHaveBeenCalled()
  })

  it('mapeia a restrição de e-mail conhecido a conflito', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hash-realizado')
    const cause = { code: '23505', constraint: 'user_account_email_unique' }
    vi.mocked(insertAccount).mockRejectedValue(new Error('SQL privado', { cause }))
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(409)
    expect(response.body.code).toBe('EMAIL_IN_USE')
    expect(response.text).not.toContain('SQL privado')
  })

  it('limita cadastro enquanto o teto de hashes estiver saturado', async () => {
    vi.mocked(hashPassword).mockRejectedValue(new HashLimitError())
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(429)
    expect(response.headers['retry-after']).toBe('1')
    expect(insertAccount).not.toHaveBeenCalled()
  })

  it('sanitiza falha inesperada de cadastro', async () => {
    vi.mocked(hashPassword).mockRejectedValue(new Error('segredo'))
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(500)
    expect(response.text).not.toContain('segredo')
  })

  it('rejeita ausência de JWT antes de procurar perfil', async () => {
    const response = await request(app).get('/api/auth/me')
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('AUTH_REQUIRED')
    expect(findOwnProfile).not.toHaveBeenCalled()
  })

  it('retorna o próprio perfil com JWT e sessão ativos', async () => {
    vi.mocked(sessionIsActive).mockResolvedValue(true)
    vi.mocked(findOwnProfile).mockResolvedValue({ userId, ...profile })
    const token = await signAccessToken({ userId, sessionId })
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ userId, ...profile })
    expect(findOwnProfile).toHaveBeenCalledWith(userId)
  })

  it('recusa JWT ainda válido de sessão revogada', async () => {
    vi.mocked(sessionIsActive).mockResolvedValue(false)
    const token = await signAccessToken({ userId, sessionId })
    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(response.status).toBe(401)
    expect(findOwnProfile).not.toHaveBeenCalled()
  })
})
