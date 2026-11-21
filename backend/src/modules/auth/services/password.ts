import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { createHashLimiter } from './hashLimit.js'

const hashVersion = 'scrypt-v1'
const saltBytes = 16
const keyBytes = 32
const parameters = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }
const withHashSlot = createHashLimiter()
const dummySalt = Buffer.alloc(saltBytes)
const dummyKey = Buffer.alloc(keyBytes)

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return withHashSlot(() => new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyBytes, parameters, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  }))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltBytes)
  const key = await derive(password, salt)
  return [hashVersion, salt.toString('base64url'), key.toString('base64url')].join('$')
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const [version, encodedSalt = '', encodedKey = ''] = (stored ?? '').split('$')
  const salt = Buffer.from(encodedSalt, 'base64url')
  const key = Buffer.from(encodedKey, 'base64url')
  const validHash = version === hashVersion && salt.length === saltBytes && key.length === keyBytes
  const actual = await derive(password, validHash ? salt : dummySalt)
  return timingSafeEqual(actual, validHash ? key : dummyKey) && validHash
}
