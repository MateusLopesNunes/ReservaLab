import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEquipment, listEquipment } from './equipmentService'

const fetchMock = vi.fn<typeof fetch>()
const item = { id: 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57', name: 'Projetor', description: null }

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('serviço de equipamentos', () => {
  it('lista equipamentos recebidos da API', async () => {
    fetchMock.mockResolvedValue(Response.json([item]))
    await expect(listEquipment()).resolves.toEqual([item])
    expect(fetchMock).toHaveBeenCalledWith('/api/equipment')
  })

  it('rejeita resposta de listagem inválida', async () => {
    fetchMock.mockResolvedValue(Response.json([{ name: 'Sem ID' }]))
    await expect(listEquipment()).rejects.toThrow('A lista de equipamentos recebida é inválida.')
  })

  it('rejeita falha HTTP da listagem', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
    await expect(listEquipment()).rejects.toThrow('Não foi possível carregar os equipamentos.')
  })

  it('cadastra equipamento enviando JSON validado', async () => {
    fetchMock.mockResolvedValue(Response.json(item, { status: 201 }))
    await expect(createEquipment({ name: ' Projetor ' })).resolves.toEqual(item)
    expect(fetchMock).toHaveBeenCalledWith('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Projetor' })
    })
  })

  it('não envia nome inválido', async () => {
    await expect(createEquipment({ name: '  ' })).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejeita falha HTTP no cadastro', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }))
    await expect(createEquipment({ name: 'Projetor' })).rejects.toThrow('Não foi possível cadastrar o equipamento.')
  })

  it('rejeita equipamento cadastrado com resposta inválida', async () => {
    fetchMock.mockResolvedValue(Response.json({ name: 'Projetor' }))
    await expect(createEquipment({ name: 'Projetor' })).rejects.toThrow('O equipamento recebido é inválido.')
  })
})
