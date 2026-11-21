import { createHash, randomBytes } from 'node:crypto'

const secretBytes = 32

export function newRefreshSecret(): string {
  return randomBytes(secretBytes).toString('base64url')
}

export function digestRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}
