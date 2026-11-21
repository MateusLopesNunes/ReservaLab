import { findAccountCredentials, insertAccount } from '../data/accountRepository.js'
import type { Credentials, Registration } from '../schemas/credentials.js'
import { AuthError } from './authError.js'
import { hashPassword, verifyPassword } from './password.js'

function duplicateEmail(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && 'constraint' in error) {
    return error.code === '23505' && error.constraint === 'user_account_email_unique'
  }
  return 'cause' in error && error.cause !== error && duplicateEmail(error.cause)
}

export async function registerAccount(input: Registration) {
  const { password, ...profile } = input
  const passwordHash = await hashPassword(password)
  try {
    const userId = await insertAccount({ ...profile, passwordHash })
    return { userId }
  } catch (error) {
    if (duplicateEmail(error)) throw new AuthError(409, 'EMAIL_IN_USE', 'Não foi possível cadastrar esse e-mail.')
    throw error
  }
}

export async function identifyCredentials(input: Credentials): Promise<string> {
  const account = await findAccountCredentials(input.email)
  const valid = await verifyPassword(input.password, account?.passwordHash)
  if (!valid || !account) throw new AuthError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
  return account.userId
}
