import { optionsExist } from '../../profileOptions/queries.js'
import { findAccountCredentials, insertAccount } from '../data/accountRepository.js'
import type { Credentials, Registration } from '../schemas/credentials.js'
import { AuthError } from './authError.js'
import { hashPassword, verifyPassword } from './password.js'

function matchesConstraint(error: unknown, code: string, names: readonly string[]): boolean {
  if (!error || typeof error !== 'object') return false
  if ('code' in error && 'constraint' in error) {
    return error.code === code && typeof error.constraint === 'string' && names.includes(error.constraint)
  }
  return 'cause' in error && error.cause !== error && matchesConstraint(error.cause, code, names)
}

function duplicateEmail(error: unknown): boolean {
  return matchesConstraint(error, '23505', ['user_account_email_unique'])
}

export async function registerAccount(input: Registration) {
  if (!(await optionsExist(input.state, input.city, input.sex))) {
    throw new AuthError(400, 'INVALID_PROFILE_OPTIONS', 'Confira estado, cidade e sexo selecionados.')
  }
  const { password, ...profile } = input
  const passwordHash = await hashPassword(password)
  try {
    const userId = await insertAccount({ ...profile, passwordHash })
    return { userId }
  } catch (error) {
    if (matchesConstraint(error, '23503', ['user_account_state_fk', 'user_account_city_state_fk', 'user_account_sex_fk'])) {
      throw new AuthError(400, 'INVALID_PROFILE_OPTIONS', 'Confira estado, cidade e sexo selecionados.')
    }
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
