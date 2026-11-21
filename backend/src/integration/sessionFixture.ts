import { randomUUID } from 'node:crypto'
import request from 'supertest'
import app from '../app.js'

export const origin = process.env.AUTH_ALLOWED_ORIGIN ?? 'http://127.0.0.1:5173'
export const validPassword = 'uma senha longa para o piloto'
export const profile = {
  firstName: 'Ana',
  lastName: 'da Silva',
  state: 'SP',
  city: 'São Paulo',
  birthDate: '1990-04-15',
  sex: 'Feminino'
}

export function responseCookie(headers: Record<string, unknown>): string {
  const value = headers['set-cookie']
  if (!Array.isArray(value) || typeof value[0] !== 'string') throw new Error('Esperava cookie de teste')
  return value[0]
}

export async function createSession() {
  const email = `${randomUUID()}@example.com`
  const registered = await request(app).post('/api/auth/register')
    .set('Origin', origin).send({ email, password: validPassword, ...profile }).expect(201)
  const loggedIn = await request(app).post('/api/auth/login')
    .set('Origin', origin).send({ email, password: validPassword }).expect(200)
  return { userId: registered.body.userId as string, sessionId: loggedIn.body.sessionId as string,
    token: loggedIn.body.accessToken as string, cookie: responseCookie(loggedIn.headers).split(';')[0] ?? '', email }
}

export async function createEquipment(token: string): Promise<string> {
  const response = await request(app).post('/api/equipment').auth(token, { type: 'bearer' })
    .send({ name: 'Projetor de integração' }).expect(201)
  return response.body.id as string
}
