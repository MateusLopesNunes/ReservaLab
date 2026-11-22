import { z } from 'zod'

const minimumKeyLength = 32
const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]'])
const configSchema = z.object({
  AUTH_JWT_SECRET: z.string().regex(/^[A-Za-z0-9_-]+$/),
  AUTH_ALLOWED_ORIGIN: z.url(),
  AUTH_ALLOW_INSECURE_LOOPBACK: z.enum(['true', 'false']).default('false')
})

export type AuthConfig = { jwtSecret: Uint8Array; origin: string; secureCookie: boolean }

export function validateAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const result = configSchema.safeParse(env)
  if (!result.success) throw new Error('Configuração de autenticação inválida.')
  const values = result.data
  const jwtSecret = Buffer.from(values.AUTH_JWT_SECRET, 'base64url')
  if (jwtSecret.length < minimumKeyLength || jwtSecret.toString('base64url') !== values.AUTH_JWT_SECRET) {
    throw new Error('Configuração de autenticação inválida.')
  }
  const origin = new URL(values.AUTH_ALLOWED_ORIGIN)
  const secureCookie = origin.protocol === 'https:'
  const localHttp = origin.protocol === 'http:' && loopbackHosts.has(origin.hostname) &&
    values.AUTH_ALLOW_INSECURE_LOOPBACK === 'true' && env.NODE_ENV !== 'production'
  if (origin.origin !== values.AUTH_ALLOWED_ORIGIN || (!secureCookie && !localHttp)) {
    throw new Error('Origem de autenticação inválida.')
  }
  return { jwtSecret, origin: origin.origin, secureCookie }
}
