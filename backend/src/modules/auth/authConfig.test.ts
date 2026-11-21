import { describe, expect, it } from 'vitest'
import { validateAuthConfig } from './authConfig.js'

const secret = Buffer.alloc(32, 7).toString('base64url')
const valid = { AUTH_JWT_SECRET: secret, AUTH_ALLOWED_ORIGIN: 'https://example.test' }

describe('configuração de autenticação', () => {
  it('exige cookie seguro para origem HTTPS', () => {
    expect(validateAuthConfig(valid)).toMatchObject({ origin: 'https://example.test', secureCookie: true })
  })

  it('permite cookie local apenas com configuração explícita', () => {
    const env = { ...valid, AUTH_ALLOWED_ORIGIN: 'http://127.0.0.1:5173' }
    expect(() => validateAuthConfig(env)).toThrow()
    const local = { ...env, AUTH_ALLOW_INSECURE_LOOPBACK: 'true' }
    expect(validateAuthConfig(local).secureCookie).toBe(false)
    expect(() => validateAuthConfig({ ...local, NODE_ENV: 'production' })).toThrow()
  })

  it.each(['https://example.test/', 'https://example.test/path', 'http://example.test', 'ftp://localhost'])(
    'recusa origem não autorizada %s', origin => {
      expect(() => validateAuthConfig({ ...valid, AUTH_ALLOWED_ORIGIN: origin, AUTH_ALLOW_INSECURE_LOOPBACK: 'true' }))
        .toThrow('Origem de autenticação inválida.')
    }
  )

  it('rejeita chave curta sem expor seu valor', () => {
    expect(() => validateAuthConfig({ ...valid, AUTH_JWT_SECRET: 'YWJjZA' }))
      .toThrow('Configuração de autenticação inválida.')
  })
})
