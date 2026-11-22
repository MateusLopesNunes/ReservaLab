<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { loginSchema } from '../schemas/authSchema'
import { location, navigate, postLoginPath } from '../services/navigation'
import { AuthApiError } from '../services/sessionApi'
import { login } from '../services/sessionCoordinator'

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)
let mounted = true
onUnmounted(() => { mounted = false })
const registered = computed(() => location.value.searchParams.get('registered') === '1')
const registrationPath = computed(() => '/cadastro?' + new URLSearchParams({ next: postLoginPath() }).toString())

async function enter(): Promise<void> {
  if (pending.value) return
  error.value = ''
  const form = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!form.success) {
    error.value = form.error.issues[0]?.message ?? 'Confira os campos do formulário.'
    return
  }

  const next = postLoginPath()
  pending.value = true
  try {
    await login(form.data)
    if (mounted) navigate(next, true)
  } catch (failure) {
    error.value = failure instanceof AuthApiError
      ? failure.message : 'Não foi possível entrar. Tente de novo.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="container">
    <h1>Entrar</h1>
    <p v-if="registered" class="success" role="status">Conta criada. Entre para continuar.</p>
    <form class="card" novalidate @submit.prevent="enter">
      <label for="login-email">E-mail</label>
      <input id="login-email" v-model="email" type="email" autocomplete="username" maxlength="254" required>

      <label for="login-password">Senha</label>
      <input id="login-password" v-model="password" type="password" autocomplete="current-password" maxlength="128" required>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button type="submit" :disabled="pending">{{ pending ? 'Entrando…' : 'Entrar' }}</button>
    </form>
    <p>Primeiro acesso? <a :href="registrationPath">Crie sua conta</a>.</p>
  </main>
</template>
