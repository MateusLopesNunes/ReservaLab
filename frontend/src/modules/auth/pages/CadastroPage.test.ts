import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CadastroPage from './CadastroPage.vue'

const mocks = vi.hoisted(() => ({
  states: vi.fn(), cities: vi.fn(), sexes: vi.fn(), register: vi.fn()
}))

vi.mock('../services/profileOptions', () => ({
  listStates: mocks.states, listCities: mocks.cities, listSexes: mocks.sexes
}))
vi.mock('../services/sessionApi', () => ({
  AuthApiError: class extends Error {}, submitRegistration: mocks.register
}))
vi.mock('../services/navigation', () => ({
  loginPath: () => '/login', navigate: vi.fn(), postLoginPath: () => '/equipamentos'
}))

const cityA = { id: 'c9ca84fc-b637-4a2b-8cf4-31fdab4a802c', name: 'Ceres', stateCode: 'GO' }
const cityB = { id: '58c27db4-c279-48af-a87a-1aed7b4a802c', name: 'Outra cidade', stateCode: 'SP' }
const nameField = (wrapper: ReturnType<typeof mount>) => wrapper.get<HTMLInputElement>('#firstName').element.value

beforeEach(() => {
  vi.clearAllMocks()
  mocks.states.mockResolvedValue([{ code: 'GO', name: 'Goiás' }, { code: 'SP', name: 'São Paulo' }])
  mocks.sexes.mockResolvedValue([{ code: 'outro', label: 'Outro' }])
  mocks.cities.mockResolvedValue([cityA])
  mocks.register.mockResolvedValue(undefined)
})

describe('opções do cadastro', () => {
  it('consulta listas, permite seleção e envia os identificadores', async () => {
    const wrapper = mount(CadastroPage)
    await flushPromises()
    await wrapper.get('#firstName').setValue('Ana')
    await wrapper.get('#lastName').setValue('Silva')
    await wrapper.get('#email').setValue('ana@example.test')
    await wrapper.get('#password').setValue('senha comprida de teste')
    await wrapper.get('#birthDate').setValue('1990-03-02')
    await wrapper.get('#state').setValue('GO')
    await flushPromises()
    await wrapper.get('#city').setValue(cityA.id)
    await wrapper.get('#sex').setValue('outro')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.cities).toHaveBeenCalledWith('GO')
    expect(mocks.register).toHaveBeenCalledWith(expect.objectContaining({ state: 'GO', city: cityA.id, sex: 'outro' }))
    wrapper.unmount()
  })

  it('permite nova tentativa se as listas falharem sem apagar dados digitados', async () => {
    mocks.states.mockRejectedValueOnce(new Error('rede'))
    const wrapper = mount(CadastroPage)
    await flushPromises()
    await wrapper.get('#firstName').setValue('Ana')
    expect(wrapper.get('[role=alert]').text()).toContain('Não foi possível')
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(nameField(wrapper)).toBe('Ana')
    expect(wrapper.find('[role=alert]').exists()).toBe(false)
    expect(wrapper.get('#state').text()).toContain('Goiás')
    wrapper.unmount()
  })

  it('limpa cidade e descarta consulta atrasada quando o estado muda', async () => {
    let resolveOld!: (value: typeof cityA[]) => void
    mocks.cities.mockImplementation((state: string) => state === 'GO'
      ? new Promise(resolve => { resolveOld = resolve })
      : Promise.resolve([cityB]))
    const wrapper = mount(CadastroPage)
    await flushPromises()
    await wrapper.get('#state').setValue('GO')
    await wrapper.get('#state').setValue('SP')
    await flushPromises()
    await wrapper.get('#city').setValue(cityB.id)
    resolveOld([cityA])
    await flushPromises()
    expect(wrapper.get('#city').text()).toContain('Outra cidade')
    expect(wrapper.get('#city').text()).not.toContain('Ceres')
    expect(wrapper.get<HTMLSelectElement>('#city').element.value).toBe(cityB.id)
    wrapper.unmount()
  })

  it('informa lista vazia de cidades e recupera após nova tentativa', async () => {
    mocks.cities.mockResolvedValueOnce([]).mockResolvedValueOnce([cityA])
    const wrapper = mount(CadastroPage)
    await flushPromises()
    await wrapper.get('#state').setValue('GO')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Não há cidades')
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('#city').text()).toContain('Ceres')
    wrapper.unmount()
  })

  it('impede envio de identificador de cidade que não pertence às opções carregadas', async () => {
    const wrapper = mount(CadastroPage)
    await flushPromises()
    await wrapper.get('#state').setValue('GO')
    await flushPromises()
    expect(wrapper.get('#city').findAll('option')).toHaveLength(2)
    await wrapper.get('form').trigger('submit')
    expect(mocks.register).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
