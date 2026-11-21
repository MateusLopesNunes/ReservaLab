import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getStatus } from './statusService'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('getStatus', () => {
  it('consulta o endpoint e retorna uma resposta válida', async () => {
    const status = { status: 'ok', message: 'API disponível' }
    fetchMock.mockResolvedValue(Response.json(status))

    await expect(getStatus()).resolves.toEqual(status)
    expect(fetchMock).toHaveBeenCalledWith('/api/status')
  })

  it('rejeita respostas HTTP sem sucesso', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }))

    await expect(getStatus()).rejects.toThrow('Falha ao consultar a API')
  })

  it('propaga falhas de conexão', async () => {
    fetchMock.mockRejectedValue(new TypeError('Sem conexão'))

    await expect(getStatus()).rejects.toThrow('Sem conexão')
  })

  it('rejeita conteúdo que não seja JSON válido', async () => {
    fetchMock.mockResolvedValue(new Response('conteúdo inválido'))

    await expect(getStatus()).rejects.toThrow(SyntaxError)
  })

  it.each([
    null,
    'ok',
    {},
    { status: 'error', message: 'Falha' },
    { status: 'ok' },
    { status: 'ok', message: 123 }
  ])('rejeita dados fora do contrato: %j', async (payload: unknown) => {
    fetchMock.mockResolvedValue(Response.json(payload))

    await expect(getStatus()).rejects.toThrow('Resposta de status inválida')
  })
})
