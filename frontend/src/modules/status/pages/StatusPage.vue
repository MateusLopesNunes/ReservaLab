<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getStatus } from '../services/statusService'

const loading = ref(true)
const message = ref('')
const error = ref(false)

async function checkApi(): Promise<void> {
  loading.value = true
  error.value = false

  try {
    const data = await getStatus()
    message.value = data.message
  } catch {
    error.value = true
    message.value = 'Não foi possível conectar à API. Verifique se o backend está em execução.'
  } finally {
    loading.value = false
  }
}

onMounted(checkApi)
</script>

<template>
  <main class="container">
    <p class="eyebrow">PROJETO INICIAL</p>
    <h1>ReservaLab</h1>
    <p class="description">Um ponto de partida para a gestão de reservas de equipamentos.</p>
    <a class="primary-link" href="/equipamentos">Ver equipamentos</a>

    <section class="card" aria-labelledby="status-title">
      <h2 id="status-title">Conexão com a API</h2>
      <p v-if="loading" role="status">Consultando o backend...</p>
      <p v-else :class="error ? 'error' : 'success'" role="status">{{ message }}</p>
      <button type="button" :disabled="loading" @click="checkApi">Verificar novamente</button>
    </section>
  </main>
</template>
