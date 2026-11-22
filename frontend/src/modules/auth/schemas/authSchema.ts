import { z } from 'zod'

const email = z.email('Informe um e-mail válido.').max(254).trim().toLowerCase()
const field = (label: string, max: number) => z.string().trim()
  .min(1, label + ' é obrigatório.').max(max, 'Use até ' + max + ' caracteres.')

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(email),
  password: z.string().min(1, 'Informe a senha.').max(128)
})

export const registrationSchema = loginSchema.extend({
  password: z.string().min(15, 'Use pelo menos 15 caracteres.').max(128, 'Use até 128 caracteres.'),
  firstName: field('O nome', 100),
  lastName: field('O sobrenome', 100),
  state: z.string().length(2, 'Selecione um estado.'),
  city: z.uuid('Selecione uma cidade.'),
  birthDate: z.iso.date('Informe uma data de nascimento válida.').refine(
    value => value <= new Date().toISOString().slice(0, 10),
    'A data de nascimento não pode estar no futuro.'
  ),
  sex: field('O sexo', 60)
})

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  userId: z.uuid(),
  sessionId: z.uuid()
})

export const registeredAccountSchema = z.object({ userId: z.uuid() })
export const apiErrorSchema = z.object({ code: z.string(), message: z.string() })

export type LoginInput = z.input<typeof loginSchema>
export type RegistrationInput = z.input<typeof registrationSchema>
export type Session = z.output<typeof sessionSchema>
