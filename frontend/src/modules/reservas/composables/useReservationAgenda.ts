import { onScopeDispose, ref, watch } from 'vue'
import type { Reservation } from '../schemas/reservationSchema'
import { listReservations } from '../services/reservationService'

type Selection = { equipmentId: string; generation: number }

export function useReservationAgenda() {
  const equipmentId = ref('')
  const reservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref('')
  let generation = 0
  let lastRequest = 0

  function selection(): Selection | undefined {
    return equipmentId.value ? { equipmentId: equipmentId.value, generation } : undefined
  }

  function remainsSelected(original: Selection): boolean {
    return original.generation === generation
  }

  async function refresh(): Promise<void> {
    const selected = selection()
    if (!selected) return
    const request = ++lastRequest
    const isCurrent = () => remainsSelected(selected) && request === lastRequest

    loading.value = true
    error.value = ''
    try {
      const items = await listReservations(selected.equipmentId)
      if (isCurrent()) reservations.value = items
    } catch {
      if (isCurrent()) error.value = 'Não foi possível carregar a agenda. Tente novamente.'
    } finally {
      if (isCurrent()) loading.value = false
    }
  }

  watch(equipmentId, () => {
    generation++
    reservations.value = []
    loading.value = false
    error.value = ''
    void refresh()
  }, { flush: 'sync' })

  onScopeDispose(() => { generation++ })

  return { equipmentId, reservations, loading, error, selection, remainsSelected, refresh }
}
