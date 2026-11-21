import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEquipment, listEquipment } from './equipmentRepository.js'

const mocks = vi.hoisted(() => ({
  orderBy: vi.fn(), returning: vi.fn(), values: vi.fn(), from: vi.fn(), insert: vi.fn(), select: vi.fn()
}))

vi.mock('../../../db/client.js', () => ({ db: { select: mocks.select, insert: mocks.insert } }))

const item = { id: 'id', name: 'Projetor', description: null }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.select.mockReturnValue({ from: mocks.from })
  mocks.from.mockReturnValue({ orderBy: mocks.orderBy })
  mocks.insert.mockReturnValue({ values: mocks.values })
  mocks.values.mockReturnValue({ returning: mocks.returning })
})

describe('repositório de equipamentos', () => {
  it('retorna os equipamentos consultados', async () => {
    mocks.orderBy.mockResolvedValue([item])
    await expect(listEquipment()).resolves.toEqual([item])
  })

  it('retorna o equipamento cadastrado', async () => {
    mocks.returning.mockResolvedValue([item])
    await expect(createEquipment({ name: 'Projetor' })).resolves.toEqual(item)
    expect(mocks.values).toHaveBeenCalledWith({ name: 'Projetor' })
  })

  it('informa falha se a inserção não retornar um registro', async () => {
    mocks.returning.mockResolvedValue([])
    await expect(createEquipment({ name: 'Projetor' })).rejects.toThrow('Falha ao cadastrar equipamento')
  })
})
