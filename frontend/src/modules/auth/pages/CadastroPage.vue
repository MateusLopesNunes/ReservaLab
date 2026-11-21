<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
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
  { name: 'state', label: 'Estado', type: 'text', autocomplete: 'address-level1', maxlength: 100 },
  { name: 'city', label: 'Cidade', type: 'text', autocomplete: 'address-level2', maxlength: 120 },
  { name: 'birthDate', label: 'Data de nascimento', type: 'date', autocomplete: 'bday', maxlength: undefined },
  { name: 'sex', label: 'Sexo', type: 'text', autocomplete: 'sex', maxlength: 60 }
] as const
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
    errors.value = Object.fromEntries(fields.flatMap(field => {
      const issue = parsed.error.issues.find(issue => issue.path[0] === field.name)
      return issue ? [[field.name, issue.message]] : []
    }))
    error.value = 'Confira os campos assinalados.'
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
    pending.value = false
  }
}
</script>

<template>
  <main class="container">
    <a :href="returnPath" class="back-link">Voltar para entrar</a>
    <h1>Criar conta</h1>
    <p class="description">Preencha todos os campos. A senha precisa ter pelo menos 15 caracteres.</p>
    <form class="card" novalidate @submit.prevent="register">
      <template v-for="field in fields" :key="field.name">
        <label :for="field.name">{{ field.label }}</label>
        <input
          :id="field.name"
          v-model="form[field.name]"
          :type="field.type"
          :autocomplete="field.autocomplete"
          :maxlength="field.maxlength"
          :aria-invalid="errors[field.name] ? true : undefined"
          :aria-describedby="errors[field.name] ? field.name + '-error' : undefined"
          required
        >
        <span v-if="errors[field.name]" :id="field.name + '-error'" class="error">{{ errors[field.name] }}</span>
      </template>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="pending">{{ pending ? 'Criando conta…' : 'Criar conta' }}</button>
    </form>
  </main>
</template>
