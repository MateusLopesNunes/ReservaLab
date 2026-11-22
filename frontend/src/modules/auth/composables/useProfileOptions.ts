import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { listCities, listSexes, listStates, type CityOption, type SexOption, type StateOption } from '../services/profileOptions'

export function useProfileOptions(state: Ref<string>, city: Ref<string>, sex: Ref<string>) {
  const states = ref<StateOption[]>([])
  const cities = ref<CityOption[]>([])
  const sexes = ref<SexOption[]>([])
  const loading = ref(false)
  const loadingCities = ref(false)
  const error = ref('')
  const cityError = ref('')
  let mounted = true
  let requestId = 0
  const ready = computed(() => !loading.value && !loadingCities.value && !error.value && !cityError.value
    && states.value.some(item => item.code === state.value)
    && cities.value.some(item => item.id === city.value && item.stateCode === state.value)
    && sexes.value.some(item => item.code === sex.value))

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const [nextStates, nextSexes] = await Promise.all([listStates(), listSexes()])
      if (!mounted) return
      states.value = nextStates
      sexes.value = nextSexes
      if (!nextStates.length || !nextSexes.length) error.value = 'Não há opções disponíveis para cadastro.'
    } catch {
      if (mounted) error.value = 'Não foi possível carregar as opções de cadastro.'
    } finally {
      if (mounted) loading.value = false
    }
  }

  async function loadCities(selectedState: string): Promise<void> {
    const current = ++requestId
    city.value = ''
    cities.value = []
    cityError.value = ''
    if (!selectedState) {
      loadingCities.value = false
      return
    }
    loadingCities.value = true
    try {
      const nextCities = await listCities(selectedState)
      if (!mounted || current !== requestId) return
      if (nextCities.some(item => item.stateCode !== selectedState)) throw new Error('Estado inválido')
      cities.value = nextCities
      if (!nextCities.length) cityError.value = 'Não há cidades cadastradas para este estado.'
    } catch {
      if (mounted && current === requestId) cityError.value = 'Não foi possível carregar as cidades.'
    } finally {
      if (mounted && current === requestId) loadingCities.value = false
    }
  }

  watch(state, selected => void loadCities(selected))
  onMounted(() => void load())
  onUnmounted(() => { mounted = false; requestId++ })
  return { states, cities, sexes, loading, loadingCities, error, cityError, ready, load, loadCities }
}
