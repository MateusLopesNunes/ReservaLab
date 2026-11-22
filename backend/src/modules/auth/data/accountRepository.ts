import { eq } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import type { Registration } from '../schemas/credentials.js'
import { and } from 'drizzle-orm'
import { city } from '../../profileOptions/data/city.schema.js'
import { state } from '../../profileOptions/data/state.schema.js'
import { sexOption } from '../../profileOptions/data/sexOption.schema.js'
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
    lastName: userAccount.lastName, state: state.name, city: city.name,
    birthDate: userAccount.birthDate, sex: sexOption.label
  }).from(userAccount)
    .innerJoin(state, eq(userAccount.state, state.code))
    .innerJoin(city, and(eq(userAccount.city, city.id), eq(userAccount.state, city.stateCode)))
    .innerJoin(sexOption, eq(userAccount.sex, sexOption.code))
    .where(eq(userAccount.id, userId))
  return account
}
