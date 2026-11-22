import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { app, credentials, profile, setAuthEnv } from './test/authRoutes.fixture.js'
import { insertAccount } from './data/accountRepository.js'
import { optionsExist } from '../profileOptions/queries.js'
import { hashPassword } from './services/password.js'

const registration = { ...profile, password: credentials.password }

beforeEach(() => {
  vi.resetAllMocks()
  setAuthEnv()
  vi.mocked(optionsExist).mockResolvedValue(true)
})
afterEach(() => vi.unstubAllEnvs())

describe('opções de cadastro', () => {
  it('rejeita opções ausentes ou incompatíveis antes do hash', async () => {
    vi.mocked(optionsExist).mockResolvedValue(false)
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(400)
    expect(response.body.code).toBe('INVALID_PROFILE_OPTIONS')
    expect(hashPassword).not.toHaveBeenCalled()
  })

  it('mapeia remoção concorrente da cidade para 400 sem expor SQL', async () => {
    vi.mocked(hashPassword).mockResolvedValue('hash-realizado')
    vi.mocked(insertAccount).mockRejectedValue(new Error('SQL privado', {
      cause: { code: '23503', constraint: 'user_account_city_state_fk' }
    }))
    const response = await request(app).post('/api/auth/register').send(registration)
    expect(response.status).toBe(400)
    expect(response.body.code).toBe('INVALID_PROFILE_OPTIONS')
    expect(response.text).not.toContain('SQL privado')
  })

})
