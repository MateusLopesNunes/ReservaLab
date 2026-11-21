<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CadastroPage from './modules/auth/pages/CadastroPage.vue'
import LoginPage from './modules/auth/pages/LoginPage.vue'
import { isPrivatePath, listenForNavigation, location, loginPath, navigate } from './modules/auth/services/navigation'
import { listenForSessionChanges, logout, renewSession } from './modules/auth/services/sessionCoordinator'
import { session } from './modules/auth/services/sessionState'
import EquipamentosPage from './modules/equipamentos/pages/EquipamentosPage.vue'
import ReservasPage from './modules/reservas/pages/ReservasPage.vue'
import StatusPage from './modules/status/pages/StatusPage.vue'

const pages = new Map([
  ['/login', LoginPage],
  ['/cadastro', CadastroPage],
  ['/equipamentos', EquipamentosPage],
  ['/reservas', ReservasPage]
])
const path = computed(() => location.value.pathname)
const privatePage = computed(() => isPrivatePath(path.value))
const page = computed(() => pages.get(path.value) ?? StatusPage)
const checked = ref(false)
const checkFailed = ref(false)
const leaving = ref(false)
const logoutError = ref('')
let stopNavigation: (() => void) | undefined
let stopSessionEvents: (() => void) | undefined

async function restore(): Promise<void> {
  checked.value = false
  checkFailed.value = false
  try {
    await renewSession()
    checked.value = true
  } catch {
    checkFailed.value = true
  }
}

watch([checked, privatePage, session], () => {
  if (session.value) {
    checked.value = true
    checkFailed.value = false
    return
  }
  if (checked.value && privatePage.value) {
    navigate(loginPath(path.value), true)
  }
})

onMounted(() => {
  stopNavigation = listenForNavigation()
  stopSessionEvents = listenForSessionChanges()
  void restore()
})

onUnmounted(() => {
  stopNavigation?.()
  stopSessionEvents?.()
})

function follow(event: MouseEvent, target: string): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate(target)
}

async function leave(): Promise<void> {
  if (leaving.value) return
  leaving.value = true
  logoutError.value = ''
  try {
    const next = privatePage.value ? path.value : '/equipamentos'
    await logout()
    navigate(loginPath(next), true)
  } catch {
    logoutError.value = 'Não foi possível sair. Tente de novo.'
  } finally {
    leaving.value = false
  }
}
</script>

<template>
  <header class="app-header">
    <nav aria-label="Navegação principal">
      <a href="/" @click="follow($event, '/')">ReservaLab</a>
      <a href="/equipamentos" :aria-current="path === '/equipamentos' ? 'page' : undefined" @click="follow($event, '/equipamentos')">Equipamentos</a>
      <a href="/reservas" :aria-current="path === '/reservas' ? 'page' : undefined" @click="follow($event, '/reservas')">Reservas</a>
      <button v-if="session" type="button" :disabled="leaving" @click="leave">{{ leaving ? 'Saindo…' : 'Sair' }}</button>
      <a v-else href="/login" @click="follow($event, '/login')">Entrar</a>
    </nav>
    <p v-if="logoutError" class="error" role="alert">{{ logoutError }}</p>
  </header>

  <template v-if="privatePage && (!checked || !session)">
    <main v-if="checkFailed" class="container">
      <p class="error" role="alert">Não foi possível verificar sua sessão.</p>
      <button type="button" @click="restore">Tentar novamente</button>
    </main>
    <main v-else class="container">
      <p role="status">Verificando sessão…</p>
    </main>
  </template>
  <component v-else :is="page" :key="privatePage ? path + session?.sessionId : path" />
</template>

<style scoped>
.app-header { background: white; border-bottom: 1px solid #dce5eb; }
.app-header nav { max-width: 720px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; flex-wrap: wrap; gap: 12px 20px; }
.app-header a { color: #205e69; }
.app-header a:first-child, .app-header a[aria-current] { font-weight: 700; }
.app-header p { max-width: 720px; margin: 0 auto; padding: 0 24px 12px; }
</style>
