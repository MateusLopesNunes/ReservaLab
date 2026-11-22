import { onMounted, onScopeDispose, ref } from 'vue'
import { listEquipment } from '../../equipamentos/services/equipmentService'
import type { Equipment } from '../../equipamentos/schemas/equipmentSchema'

export function useEquipmentOptions() {
  const options = ref<Equipment[]>([])
  const loading = ref(false)
  const error = ref('')
  let active = true

  async function load(): Promise<void> {
    if (loading.value) return
    loading.value = true
    error.value = ''
    try {
      const items = await listEquipment()
      if (active) options.value = items
    } catch {
      if (active) error.value = 'Não foi possível carregar os equipamentos.'
    } finally {
      if (active) loading.value = false
    }
  }

  onMounted(load)
  onScopeDispose(() => { active = false })

  return { options, loading, error, load }
}
