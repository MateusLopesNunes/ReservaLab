import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EquipamentosPage from './EquipamentosPage.vue'
import { createEquipment, listEquipment } from '../services/equipmentService'

vi.mock('../services/equipmentService', () => ({
  createEquipment: vi.fn(),
  listEquipment: vi.fn()
}))

const item = { id: 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57', name: 'Projetor', description: null }

beforeEach(() => vi.resetAllMocks())

describe('EquipamentosPage', () => {
  it('exibe carregamento e depois o estado vazio', async () => {
    vi.mocked(listEquipment).mockResolvedValue([])
    const wrapper = mount(EquipamentosPage)
    expect(wrapper.text()).toContain('Carregando equipamentos...')
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum equipamento cadastrado ainda.')
    wrapper.unmount()
  })

  it('lista equipamentos e permite atualizar a lista', async () => {
    vi.mocked(listEquipment).mockResolvedValueOnce([item]).mockResolvedValueOnce([])
    const wrapper = mount(EquipamentosPage)
    await flushPromises()
    expect(wrapper.findAll('.equipment-list li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Projetor')
    await wrapper.get('button.secondary').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum equipamento cadastrado ainda.')
    wrapper.unmount()
  })

  it('mostra erro de carregamento e permite tentar novamente', async () => {
    vi.mocked(listEquipment).mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce([item])
    const wrapper = mount(EquipamentosPage)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Projetor')
    wrapper.unmount()
  })

  it('valida nome obrigatório antes de chamar a API', async () => {
    vi.mocked(listEquipment).mockResolvedValue([])
    const wrapper = mount(EquipamentosPage)
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('form [role="alert"]').text()).toContain('Informe o nome')
    expect(createEquipment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cadastra e acrescenta o equipamento à lista', async () => {
    vi.mocked(listEquipment).mockResolvedValue([])
    vi.mocked(createEquipment).mockResolvedValue(item)
    const wrapper = mount(EquipamentosPage)
    await flushPromises()
    await wrapper.get('#equipment-name').setValue(' Projetor ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(createEquipment).toHaveBeenCalledWith({ name: 'Projetor' })
    expect(wrapper.text()).toContain('Equipamento cadastrado com sucesso.')
    expect(wrapper.get('.equipment-list li').text()).toContain('Projetor')
    expect((wrapper.get('#equipment-name').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it('mostra falha de cadastro e preserva os dados digitados', async () => {
    vi.mocked(listEquipment).mockResolvedValue([])
    vi.mocked(createEquipment).mockRejectedValue(new Error('Sem conexão'))
    const wrapper = mount(EquipamentosPage)
    await flushPromises()
    await wrapper.get('#equipment-name').setValue('Projetor')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('form [role="alert"]').text()).toContain('Não foi possível cadastrar')
    expect((wrapper.get('#equipment-name').element as HTMLInputElement).value).toBe('Projetor')
    wrapper.unmount()
  })
})
