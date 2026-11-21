import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StatusPage from './StatusPage.vue'

const fetchMock = vi.fn<typeof fetch>()
let wrapper: VueWrapper | undefined

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('StatusPage', () => {
  it('exibe carregamento e bloqueia nova consulta enquanto aguarda a API', async () => {
    let resolveResponse!: (response: Response) => void
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveResponse = resolve }))
    wrapper = mount(StatusPage)

    expect(wrapper.get('[role="status"]').text()).toBe('Consultando o backend...')
    expect(wrapper.get('button').element.disabled).toBe(true)

    resolveResponse(Response.json({ status: 'ok', message: 'API disponível' }))
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toBe('API disponível')
    expect(wrapper.get('[role="status"]').classes()).toContain('success')
    expect(wrapper.get('button').element.disabled).toBe(false)
  })

  it('mostra uma mensagem de falha quando a API está indisponível', async () => {
    fetchMock.mockRejectedValue(new TypeError('Sem conexão'))
    wrapper = mount(StatusPage)
    await flushPromises()

    expect(wrapper.get('[role="status"]').text()).toContain('Não foi possível conectar à API')
    expect(wrapper.get('[role="status"]').classes()).toContain('error')
    expect(wrapper.get('button').element.disabled).toBe(false)
  })

  it('permite tentar novamente e substitui a falha pelo resultado da API', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))
    fetchMock.mockResolvedValueOnce(Response.json({ status: 'ok', message: 'API recuperada' }))
    wrapper = mount(StatusPage)
    await flushPromises()

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[role="status"]').text()).toBe('API recuperada')
    expect(wrapper.get('[role="status"]').classes()).toContain('success')
    expect(wrapper.get('button').element.disabled).toBe(false)
  })
})
