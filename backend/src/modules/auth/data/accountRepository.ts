import { eq } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import type { Registration } from '../schemas/credentials.js'
import { userAccount } from './userAccount.schema.js'

type AccountInput = Omit<Registration, 'password'> & { passwordHash: string }

export async function insertAccount(input: AccountInput): Promise<string> {
  const [account] = await db.insert(userAccount).values(input).returning({ id: userAccount.id })
  if (!account) throw new Error('Falha ao criar conta.')
  return account.id
}

export async function findAccountCredentials(email: string) {
  const [account] = await db.select({
    userId: userAccount.id, passwordHash: userAccount.passwordHash
  }).from(userAccount).where(eq(userAccount.email, email))
  return account
}

export async function findOwnProfile(userId: string) {
  const [account] = await db.select({
    userId: userAccount.id, email: userAccount.email, firstName: userAccount.firstName,
    lastName: userAccount.lastName, state: userAccount.state, city: userAccount.city,
    birthDate: userAccount.birthDate, sex: userAccount.sex
  }).from(userAccount).where(eq(userAccount.id, userId))
  return account
}
