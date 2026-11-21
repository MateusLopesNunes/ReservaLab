import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { navigate } from './modules/auth/services/navigation'
import { replaceSession } from './modules/auth/services/sessionState'

vi.mock('./modules/equipamentos/pages/EquipamentosPage.vue', () => ({
  default: { template: '<main><h1>Área de equipamentos</h1></main>' }
}))
vi.mock('./modules/reservas/pages/ReservasPage.vue', () => ({
  default: { template: '<main><h1>Área de reservas</h1></main>' }
}))
vi.mock('./modules/status/pages/StatusPage.vue', () => ({
  default: { template: '<main><h1>Status público</h1></main>' }
}))

const session = {
  userId: 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57',
  sessionId: 'eb754270-d623-482c-a140-0d244820f8f7',
  accessToken: 'access-token-fixture', expiresIn: 900
}
const data = {
  firstName: 'Maria', lastName: 'Oliveira', email: 'maria@example.com',
  password: 'uma-frase-bem-longa', state: 'São Paulo', city: 'Santos',
  birthDate: '1992-09-10', sex: 'Feminino'
}
const fetchMock = vi.fn<typeof fetch>()
let app: VueWrapper

beforeEach(() => {
  replaceSession(null)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  app?.unmount()
})

function open(path: string): VueWrapper {
  navigate(path, true)
  app = mount(App)
  return app
}

describe('navegação e formulários de conta', () => {
  it('mantém o status público', async () => {
    open('/')
    await flushPromises()
    expect(app.get('h1').text()).toBe('Status público')
  })

  it.each(['/equipamentos', '/reservas'])('encaminha acesso anônimo a %s para login', async path => {
    open(path)
    expect(app.get('[role="status"]').text()).toBe('Verificando sessão…')

    await flushPromises()

    expect(window.location.pathname).toBe('/login')
    expect(new URL(window.location.href).searchParams.get('next')).toBe(path)
    expect(app.get('h1').text()).toBe('Entrar')
  })

  it('preserva o destino interno autorizado ao entrar', async () => {
    open('/reservas')
    await flushPromises()
    fetchMock.mockResolvedValueOnce(Response.json(session))

    await app.get('#login-email').setValue(' MARIA@EXAMPLE.COM ')
    await app.get('#login-password').setValue(data.password)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(window.location.pathname).toBe('/reservas')
    expect(app.get('h1').text()).toBe('Área de reservas')
    expect(fetchMock.mock.lastCall?.[1]?.body).toBe(JSON.stringify({ email: data.email, password: data.password }))
  })

  it('libera a área protegida após login mesmo se a restauração inicial falhou', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))
    open('/login?next=%2Freservas')
    await flushPromises()

    fetchMock.mockResolvedValueOnce(Response.json(session))
    await app.get('#login-email').setValue(data.email)
    await app.get('#login-password').setValue(data.password)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(window.location.pathname).toBe('/reservas')
    expect(app.get('h1').text()).toBe('Área de reservas')
    expect(app.find('[role="alert"]').exists()).toBe(false)
  })

  it('restringe o destino de login a rotas conhecidas', async () => {
    open('/login?next=https%3A%2F%2Fexemplo.com')
    await flushPromises()
    fetchMock.mockResolvedValueOnce(Response.json(session))
    await app.get('#login-email').setValue(data.email)
    await app.get('#login-password').setValue(data.password)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(window.location.pathname).toBe('/equipamentos')
  })

  it('mostra erro de validação local e de login recusado', async () => {
    open('/login')
    await flushPromises()
    await app.get('form').trigger('submit')
    expect(app.get('[role="alert"]').text()).toContain('e-mail')

    fetchMock.mockResolvedValueOnce(Response.json({ code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas.' }, { status: 401 }))
    await app.get('#login-email').setValue(data.email)
    await app.get('#login-password').setValue(data.password)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(app.get('[role="alert"]').text()).toBe('Credenciais inválidas.')
    expect(app.get('h1').text()).toBe('Entrar')
  })

  it('exige todos os campos e encaminha o cadastro válido ao login', async () => {
    open('/cadastro?next=%2Freservas')
    await flushPromises()
    await app.get('form').trigger('submit')
    expect(app.findAll('input[aria-invalid="true"]')).toHaveLength(8)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValueOnce(Response.json({ userId: session.userId }, { status: 201 }))
    for (const [field, value] of Object.entries(data)) await app.get('#' + field).setValue(value)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(window.location.pathname).toBe('/login')
    expect(new URL(window.location.href).searchParams.get('next')).toBe('/reservas')
    expect(app.get('[role="status"]').text()).toBe('Conta criada. Entre para continuar.')
    expect(JSON.parse(String(fetchMock.mock.lastCall?.[1]?.body))).toEqual(data)
  })

  it('mantém os campos quando o servidor rejeita cadastro por duplicidade', async () => {
    open('/cadastro')
    await flushPromises()
    fetchMock.mockResolvedValueOnce(Response.json({ code: 'EMAIL_ALREADY_REGISTERED', message: 'E-mail já cadastrado.' }, { status: 409 }))
    for (const [field, value] of Object.entries(data)) await app.get('#' + field).setValue(value)
    await app.get('form').trigger('submit')
    await flushPromises()

    expect(app.get('[role="alert"]').text()).toBe('E-mail já cadastrado.')
    expect((app.get('#email').element as HTMLInputElement).value).toBe(data.email)
    expect(window.location.pathname).toBe('/cadastro')
  })

  it('restaura, oferece nova tentativa e permite sair da área protegida', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))
    open('/reservas')
    await flushPromises()
    expect(app.get('[role="alert"]').text()).toBe('Não foi possível verificar sua sessão.')

    fetchMock.mockResolvedValueOnce(Response.json(session))
    await app.get('main button').trigger('click')
    await flushPromises()
    expect(app.get('h1').text()).toBe('Área de reservas')

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await app.get('nav button').trigger('click')
    await flushPromises()
    expect(app.get('h1').text()).toBe('Entrar')
  })
})
