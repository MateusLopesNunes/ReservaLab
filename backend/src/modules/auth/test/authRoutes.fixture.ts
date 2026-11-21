import express from 'express'
import { vi } from 'vitest'
import { authRouter } from '../routes.js'

vi.mock('../data/accountRepository.js', () => ({
  findAccountCredentials: vi.fn(), findOwnProfile: vi.fn(), insertAccount: vi.fn()
}))
vi.mock('../data/sessionRepository.js', () => ({
  endSession: vi.fn(), sessionIsActive: vi.fn(), startSession: vi.fn()
}))
vi.mock('../data/refreshRepository.js', () => ({ rotateRefresh: vi.fn() }))
vi.mock('../services/password.js', () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }))

export const app = express().use(express.json()).use('/api/auth', authRouter)
export const origin = 'https://example.test'
export const userId = 'e6d5941f-dc95-4ac6-bd22-67e06c35eaa1'
export const sessionId = '16325457-2ae9-4caa-82d6-c9e988660905'
export const refresh = 'a'.repeat(43)
export const cookie = `reservalab_refresh=${refresh}`
export const session = { id: sessionId, userId, expiresAt: new Date('2090-01-01T00:00:00Z'), revokedAt: null }
export const credentials = { email: 'test@example.test', password: 'uma senha longa o suficiente' }
export const profile = {
  email: credentials.email, firstName: 'Nome', lastName: 'Sobrenome',
  state: 'SP', city: 'São Paulo', birthDate: '2000-01-01', sex: 'Feminino'
}

export function setAuthEnv(): void {
  vi.stubEnv('AUTH_JWT_SECRET', Buffer.alloc(32, 7).toString('base64url'))
  vi.stubEnv('AUTH_ALLOWED_ORIGIN', origin)
  vi.stubEnv('AUTH_ALLOW_INSECURE_LOOPBACK', 'false')
}
