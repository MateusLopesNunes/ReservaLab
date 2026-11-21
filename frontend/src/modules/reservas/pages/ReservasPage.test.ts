import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, expect, it, vi } from 'vitest'
import { listEquipment } from '../../equipamentos/services/equipmentService'
import { createReservation, listReservations, ReservationRequestError } from '../services/reservationService'
import type { Reservation } from '../schemas/reservationSchema'
import ReservasPage from './ReservasPage.vue'

vi.mock('../../equipamentos/services/equipmentService', () => ({ listEquipment: vi.fn() }))
vi.mock('../services/reservationService', async (original) => ({
  ...await original<typeof import('../services/reservationService')>(),
  listReservations: vi.fn(), createReservation: vi.fn()
}))

const equipmentA = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57'
const equipmentB = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc58'
const item = {
  id: equipmentA, equipmentId: equipmentA,
  startsAt: '2027-02-01T14:00:00.000Z', endsAt: '2027-02-01T15:00:00.000Z', isMine: true
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listEquipment).mockResolvedValue([
    { id: equipmentA, name: 'Projetor', description: null },
    { id: equipmentB, name: 'Câmera', description: null }
  ])
  vi.mocked(listReservations).mockResolvedValue([])
})

const open = async () => {
  const wrapper = mount(ReservasPage)
  await flushPromises()
  return wrapper
}

async function fillPeriod(wrapper: Awaited<ReturnType<typeof open>>): Promise<void> {
  await wrapper.get('select').setValue(equipmentA)
  await wrapper.get('#reservation-start').setValue('2027-02-01T14:00')
  await wrapper.get('#reservation-end').setValue('2027-02-01T15:00')
}

it('permite escolher um equipamento, mostra agenda vazia e indica o fuso', async () => {
  const wrapper = await open()
  expect(wrapper.text()).toContain('Os horários seguem o fuso')
  await wrapper.get('select').setValue(equipmentA)
  await flushPromises()
  expect(listReservations).toHaveBeenCalledWith(equipmentA)
  expect(wrapper.text()).toContain('Nenhuma reserva em andamento ou futura.')
  wrapper.unmount()
})

it('mostra erro e permite recarregar a agenda', async () => {
  vi.mocked(listReservations).mockRejectedValueOnce(new Error('offline'))
  const wrapper = await open()
  await wrapper.get('select').setValue(equipmentA)
  await flushPromises()
  expect(wrapper.get('[role=alert]').text()).toContain('Não foi possível carregar a agenda')
  await wrapper.get('[aria-labelledby=reservation-agenda-title] button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('Nenhuma reserva em andamento ou futura.')
  wrapper.unmount()
})

it('recarrega após salvar e marca a reserva da conta', async () => {
  vi.mocked(createReservation).mockResolvedValue(item)
  vi.mocked(listReservations).mockResolvedValueOnce([]).mockResolvedValueOnce([item])
  const wrapper = await open()
  await fillPeriod(wrapper)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(createReservation).toHaveBeenCalledWith(equipmentA, expect.objectContaining({
    startsAt: expect.stringMatching(/\.000Z$/), endsAt: expect.stringMatching(/\.000Z$/)
  }))
  expect(wrapper.text()).toContain('Reserva criada com sucesso')
  expect(wrapper.text()).toContain('Sua reserva')
  wrapper.unmount()
})

it('mantém o preenchimento após sobreposição', async () => {
  vi.mocked(createReservation).mockRejectedValue(new ReservationRequestError(409, ''))
  const wrapper = await open()
  await fillPeriod(wrapper)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  expect(wrapper.get('[role=alert]').text()).toContain('já está reservado nesse horário')
  expect((wrapper.get('#reservation-start').element as HTMLInputElement).value).toBe('2027-02-01T14:00')
  wrapper.unmount()
})

it('ignora a resposta de agenda do equipamento selecionado anteriormente', async () => {
  let resolveEarlier: (items: Reservation[]) => void = () => undefined
  const earlier = new Promise<Reservation[]>((resolve) => { resolveEarlier = resolve })
  vi.mocked(listReservations).mockReturnValueOnce(earlier)
  const wrapper = await open()
  await wrapper.get('select').setValue(equipmentA)
  expect(wrapper.text()).toContain('Carregando agenda')
  await wrapper.get('select').setValue(equipmentB)
  await flushPromises()
  resolveEarlier([item])
  await flushPromises()
  expect(wrapper.text()).toContain('Nenhuma reserva em andamento ou futura.')
  expect(wrapper.text()).not.toContain('Sua reserva')
  wrapper.unmount()
})

it('permite tentar novamente após falha no carregamento dos equipamentos', async () => {
  vi.mocked(listEquipment).mockRejectedValueOnce(new Error('offline'))
  const wrapper = await open()
  expect(wrapper.get('[role=alert]').text()).toContain('Não foi possível carregar os equipamentos')
  await wrapper.get('[aria-labelledby=reservation-form-title] button').trigger('click')
  await flushPromises()
  expect(wrapper.get('select').text()).toContain('Projetor')
  wrapper.unmount()
})

it('indica quando é necessário cadastrar o primeiro equipamento', async () => {
  vi.mocked(listEquipment).mockResolvedValue([])
  const wrapper = await open()
  expect(wrapper.get('[role=status]').text()).toContain('Nenhum equipamento cadastrado')
  expect(wrapper.get('a').attributes('href')).toBe('/equipamentos')
  wrapper.unmount()
})

it('mantém o preenchimento e orienta quando o fim é anterior ao início', async () => {
  const wrapper = await open()
  await fillPeriod(wrapper)
  await wrapper.get('#reservation-end').setValue('2027-02-01T13:00')
  await wrapper.get('form').trigger('submit')
  expect(wrapper.get('[role=alert]').text()).toContain('O fim deve ser posterior ao início')
  expect(createReservation).not.toHaveBeenCalled()
  expect((wrapper.get('#reservation-end').element as HTMLInputElement).value).toBe('2027-02-01T13:00')
  wrapper.unmount()
})

it('ignora a criação concluída após mudar o equipamento', async () => {
  let resolveCreation: (value: Reservation) => void = () => undefined
  vi.mocked(createReservation).mockReturnValue(new Promise((resolve) => { resolveCreation = resolve }))
  const wrapper = await open()
  await fillPeriod(wrapper)
  await wrapper.get('form').trigger('submit')
  await wrapper.get('select').setValue(equipmentB)
  await flushPromises()
  resolveCreation(item)
  await flushPromises()
  expect(wrapper.text()).not.toContain('Reserva criada com sucesso')
  expect(listReservations).toHaveBeenCalledTimes(2)
  expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  wrapper.unmount()
})
