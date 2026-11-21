import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabaseUrl } from './env.js'

beforeEach(() => vi.stubEnv('RESERVALAB_TEST_MODE', '0'))
afterEach(() => vi.unstubAllEnvs())

describe('getDatabaseUrl', () => {
  it('aceita uma URL PostgreSQL', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/test')
    expect(getDatabaseUrl()).toBe('postgresql://user:pass@localhost:5432/test')
  })

  it.each(['', 'não é uma URL', 'https://localhost/banco'])(
    'rejeita configuração inválida sem expor seu valor', (value) => {
      vi.stubEnv('DATABASE_URL', value)
      expect(getDatabaseUrl).toThrow('DATABASE_URL deve conter uma URL PostgreSQL válida')
    }
  )
})
