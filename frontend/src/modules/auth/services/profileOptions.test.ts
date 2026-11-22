import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listCities, listSexes, listStates } from './profileOptions'

const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('serviço de opções do cadastro', () => {
  it('valida e entrega os estados, cidades e opções de sexo disponíveis', async () => {
    const states = [{ code: 'GO', name: 'Goiás' }]
    const cities = [{ id: '00000000-0000-4000-8000-000000000001', name: 'Ceres', stateCode: 'GO' }]
    const sexes = [{ code: 'nao-informar', label: 'Prefiro não informar' }]
    fetchMock.mockResolvedValueOnce(Response.json(states)).mockResolvedValueOnce(Response.json(cities))
      .mockResolvedValueOnce(Response.json(sexes))
    expect(await listStates()).toEqual(states)
    expect(await listCities('GO')).toEqual(cities)
    expect(await listSexes()).toEqual(sexes)
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '/api/profile-options/states', '/api/profile-options/cities?state=GO', '/api/profile-options/sexes'
    ])
  })

  it('rejeita falhas HTTP sem apresentar resposta inválida como opção', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))
    await expect(listStates()).rejects.toThrow('Não foi possível carregar as opções.')
  })

  it('rejeita dados externos que não seguem o contrato', async () => {
    fetchMock.mockResolvedValueOnce(Response.json([{ id: 'invalido', name: 'Ceres', stateCode: 'GO' }]))
    await expect(listCities('GO')).rejects.toThrow()
  })
})
