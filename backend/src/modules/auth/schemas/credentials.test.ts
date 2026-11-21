import { describe, expect, it } from 'vitest'
import { credentialsSchema, registrationSchema, sessionInputSchema } from './credentials.js'

const registration = {
  email: ' Account@Example.test ', password: '  senha para testes  ', firstName: ' Nome ',
  lastName: ' Sobrenome ', state: ' SP ', city: ' Campinas ', birthDate: '2000-02-29', sex: ' Feminino '
}

describe('entrada de conta', () => {
  it('normaliza e-mail e perfil preservando a senha', () => {
    expect(registrationSchema.parse(registration)).toEqual({
      ...registration, email: 'account@example.test', firstName: 'Nome',
      lastName: 'Sobrenome', state: 'SP', city: 'Campinas', sex: 'Feminino'
    })
  })

  it.each(Object.keys(registration))('exige o campo %s', field => {
    const missing = Object.fromEntries(Object.entries(registration).filter(([name]) => name !== field))
    expect(registrationSchema.safeParse(missing).success).toBe(false)
  })

  it.each(['0000-01-01', '2001-02-29', '2000-04-31', '2900-01-01', '00/00/2000'])('recusa a data %s', birthDate => {
    expect(registrationSchema.safeParse({ ...registration, birthDate }).success).toBe(false)
  })

  it('rejeita valor vazio, senha curta e UUID inválido', () => {
    expect(registrationSchema.safeParse({ ...registration, state: '   ' }).success).toBe(false)
    expect(credentialsSchema.safeParse({ email: registration.email, password: 'a'.repeat(14) }).success).toBe(false)
    expect(sessionInputSchema.safeParse({ sessionId: 'inesperado' }).success).toBe(false)
  })
})
