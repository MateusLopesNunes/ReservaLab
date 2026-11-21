import { ref, watch } from 'vue'
import { resolveLocalDateTime } from '../schemas/localDateTime'
import { reservationInputSchema } from '../schemas/reservationSchema'
import { createReservation, ReservationRequestError } from '../services/reservationService'
import type { useReservationAgenda } from './useReservationAgenda'

export function useReservationForm(agenda: ReturnType<typeof useReservationAgenda>, timeZone: string) {
  const startsAt = ref('')
  const endsAt = ref('')
  const saving = ref(false)
  const error = ref('')
  const success = ref('')

  function clearFeedback(): void {
    error.value = ''
    success.value = ''
  }

  function buildPayload() {
    const start = resolveLocalDateTime(startsAt.value, timeZone)
    const end = resolveLocalDateTime(endsAt.value, timeZone)

    if (start.status === 'ambiguous' || end.status === 'ambiguous') {
      error.value = 'Escolha um horário que não se repita na mudança de fuso.'
      return
    }
    if (start.status !== 'valid' || end.status !== 'valid') {
      error.value = 'Informe horários de início e fim válidos no fuso indicado.'
      return
    }

    const result = reservationInputSchema.safeParse({ startsAt: start.instant, endsAt: end.instant })
    if (result.success) return result.data
    error.value = result.error.issues[0]?.message ?? 'Confira os horários informados.'
  }

  async function submit(): Promise<void> {
    const selected = agenda.selection()
    if (!selected || saving.value) return
    clearFeedback()
    const payload = buildPayload()
    if (!payload) return

    saving.value = true
    try {
      await createReservation(selected.equipmentId, payload)
      if (!agenda.remainsSelected(selected)) return
      startsAt.value = ''
      endsAt.value = ''
      success.value = 'Reserva criada com sucesso.'
      void agenda.refresh()
    } catch (cause) {
      if (agenda.remainsSelected(selected)) {
        error.value = cause instanceof ReservationRequestError ? cause.message : 'Não foi possível criar a reserva. Tente novamente.'
      }
    } finally {
      if (agenda.remainsSelected(selected)) saving.value = false
    }
  }

  watch(agenda.equipmentId, () => {
    clearFeedback()
    saving.value = false
  }, { flush: 'sync' })

  return { startsAt, endsAt, saving, error, success, submit }
}
