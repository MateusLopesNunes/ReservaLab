<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, toRef } from 'vue'
import { useProfileOptions } from '../composables/useProfileOptions'
import { registrationSchema, type RegistrationInput } from '../schemas/authSchema'
import { loginPath, navigate, postLoginPath } from '../services/navigation'
import { AuthApiError, submitRegistration } from '../services/sessionApi'

const form = reactive<RegistrationInput>({
  email: '', password: '', firstName: '', lastName: '',
  state: '', city: '', birthDate: '', sex: ''
})
const fields = [
  { name: 'firstName', label: 'Nome', type: 'text', autocomplete: 'given-name', maxlength: 100 },
  { name: 'lastName', label: 'Sobrenome', type: 'text', autocomplete: 'family-name', maxlength: 100 },
  { name: 'email', label: 'E-mail', type: 'email', autocomplete: 'email', maxlength: 254 },
  { name: 'password', label: 'Senha', type: 'password', autocomplete: 'new-password', maxlength: 128 },
  { name: 'birthDate', label: 'Data de nascimento', type: 'date', autocomplete: 'bday', maxlength: undefined }
] as const
const { states, cities, sexes, loading, loadingCities, error: optionsError, cityError, ready, load, loadCities } =
  useProfileOptions(toRef(form, 'state'), toRef(form, 'city'), toRef(form, 'sex'))
const errors = ref<Partial<Record<keyof RegistrationInput, string>>>({})
const error = ref('')
const pending = ref(false)
let mounted = true
onUnmounted(() => { mounted = false })
const returnPath = computed(() => loginPath(postLoginPath()))

async function register(): Promise<void> {
  if (pending.value) return
  errors.value = {}
  error.value = ''
  const parsed = registrationSchema.safeParse(form)
  if (!parsed.success) {
    errors.value = Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))
    error.value = 'Confira os campos assinalados.'
    return
  }
  if (!ready.value) {
    error.value = 'Selecione opções disponíveis para concluir o cadastro.'
    return
  }
  const next = loginPath(postLoginPath(), true)
  pending.value = true
  try {
    await submitRegistration(parsed.data)
    if (mounted) navigate(next, true)
  } catch (failure) {
    error.value = failure instanceof AuthApiError
      ? failure.message : 'Não foi possível criar sua conta. Tente de novo.'
  } finally {
    if (mounted) pending.value = false
  }
}
</script>

<template>
  <main class="container">
    <a :href="returnPath" class="back-link">Voltar para entrar</a>
    <h1>Criar conta</h1>
    <p class="description">Preencha todos os campos. A senha precisa ter pelo menos 15 caracteres.</p>
    <p v-if="loading" role="status">Carregando opções de cadastro...</p>
    <div v-if="optionsError" role="alert">
      <p class="error">{{ optionsError }}</p>
      <button type="button" @click="load">Tentar novamente</button>
    </div>
    <form class="card" novalidate @submit.prevent="register">
      <template v-for="field in fields" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input
          :id="field.name" v-model="form[field.name]" :type="field.type"
          :autocomplete="field.autocomplete" :maxlength="field.maxlength"
          :aria-invalid="errors[field.name] ? true : undefined"
          :aria-describedby="errors[field.name] ? field.name + '-error' : undefined" required
        >
        <span v-if="errors[field.name]" :id="field.name + '-error'" class="error">{{ errors[field.name] }}</span>
      </template>
      <label for="state">Estado</label>
      <select id="state" v-model="form.state" :disabled="loading || !!optionsError" :aria-invalid="errors.state ? true : undefined" :aria-describedby="errors.state ? 'state-error' : undefined" required>
        <option value="">Selecione um estado</option>
        <option v-for="state in states" :key="state.code" :value="state.code">{{ state.name }}</option>
      </select>
      <span v-if="errors.state" id="state-error" class="error">{{ errors.state }}</span>
      <label for="city">Cidade</label>
      <select id="city" v-model="form.city" :disabled="!form.state || loadingCities || !!cityError" :aria-invalid="errors.city ? true : undefined" :aria-describedby="errors.city ? 'city-error' : undefined" required>
        <option value="">Selecione uma cidade</option>
        <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
      </select>
      <span v-if="errors.city" id="city-error" class="error">{{ errors.city }}</span>
      <p v-if="loadingCities" role="status">Carregando cidades...</p>
      <div v-if="cityError" role="alert">
        <p class="error">{{ cityError }}</p>
        <button type="button" @click="loadCities(form.state)">Tentar novamente</button>
      </div>
      <label for="sex">Sexo</label>
      <select id="sex" v-model="form.sex" :disabled="loading || !!optionsError" :aria-invalid="errors.sex ? true : undefined" :aria-describedby="errors.sex ? 'sex-error' : undefined" required>
        <option value="">Selecione uma opção</option>
        <option v-for="sex in sexes" :key="sex.code" :value="sex.code">{{ sex.label }}</option>
      </select>
      <span v-if="errors.sex" id="sex-error" class="error">{{ errors.sex }}</span>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="pending || loading || loadingCities || !!optionsError || !!cityError">{{ pending ? 'Criando conta…' : 'Criar conta' }}</button>
    </form>
  </main>
</template>
