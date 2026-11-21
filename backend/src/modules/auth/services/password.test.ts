import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './password.js'

describe('senha armazenada', () => {
  it('gera representação versionada e verifica exclusivamente a senha correta', async () => {
    const password = 'uma frase para cadastro'
    const hash = await hashPassword(password)
    expect(hash).toMatch(/^scrypt-v1\$[\w-]+\$[\w-]+$/)
    expect(hash).not.toContain(password)
    await expect(verifyPassword(password, hash)).resolves.toBe(true)
    await expect(verifyPassword('senha errada de teste', hash)).resolves.toBe(false)
    await expect(verifyPassword(password, undefined)).resolves.toBe(false)
  })
})
