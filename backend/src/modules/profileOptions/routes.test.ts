import express from 'express'
import request from 'supertest'
import { beforeEach, expect, it, vi } from 'vitest'
import { profileOptionsRouter } from './routes.js'
import { listCities, listSexOptions, listStates } from './queries.js'

vi.mock('./queries.js', () => ({ listCities: vi.fn(), listSexOptions: vi.fn(), listStates: vi.fn() }))
const app = express().use('/api/profile-options', profileOptionsRouter)
beforeEach(() => vi.resetAllMocks())

it('lista estados públicos', async () => {
  vi.mocked(listStates).mockResolvedValue([{ code: 'GO', name: 'Goiás' }])
  expect((await request(app).get('/api/profile-options/states').expect(200)).body).toEqual([{ code: 'GO', name: 'Goiás' }])
})

it('filtra cidades por código de estado', async () => {
  vi.mocked(listCities).mockResolvedValue([{ id: '00000000-0000-4000-8000-000000000001', name: 'Ceres', stateCode: 'GO' }])
  const response = await request(app).get('/api/profile-options/cities?state=GO').expect(200)
  expect(response.body[0].name).toBe('Ceres')
  expect(listCities).toHaveBeenCalledWith('GO')
})

it.each(['/cities', '/cities?state=Goiás', '/cities?state=GO&extra=1'])('rejeita consulta de cidades inválida %s', async path => {
  const response = await request(app).get('/api/profile-options' + path).expect(400)
  expect(response.body.code).toBe('INVALID_STATE')
  expect(listCities).not.toHaveBeenCalled()
})

it('lista opções inclusivas do banco', async () => {
  vi.mocked(listSexOptions).mockResolvedValue([{ code: 'outro', label: 'Outro' }])
  expect((await request(app).get('/api/profile-options/sexes').expect(200)).body).toEqual([{ code: 'outro', label: 'Outro' }])
})

it.each([
  ['/states', listStates],
  ['/cities?state=GO', listCities],
  ['/sexes', listSexOptions]
] as const)('sanitiza falha ao carregar %s', async (path, fn) => {
  vi.mocked(fn).mockRejectedValue(new Error('detalhes sensíveis'))
  const response = await request(app).get('/api/profile-options' + path).expect(500)
  expect(response.body.code).toBe('OPTIONS_UNAVAILABLE')
  expect(response.text).not.toContain('detalhes sensíveis')
})

it('rejeita dados inválidos do repositório sem expor a resposta recebida', async () => {
  vi.mocked(listStates).mockResolvedValue([{ code: 'senha-privada', name: 'Estado' }])
  const response = await request(app).get('/api/profile-options/states').expect(500)
  expect(response.body).toEqual({ code: 'OPTIONS_UNAVAILABLE', message: 'Não foi possível carregar os estados.' })
  expect(response.text).not.toContain('senha-privada')
})
