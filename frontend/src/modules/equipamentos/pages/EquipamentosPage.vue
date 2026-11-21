<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createEquipment, listEquipment } from '../services/equipmentService'
import { createEquipmentSchema, type Equipment } from '../schemas/equipmentSchema'

const equipment = ref<Equipment[]>([])
const loading = ref(true)
const loadError = ref('')
const name = ref('')
const description = ref('')
const saving = ref(false)
const formError = ref('')
const successMessage = ref('')

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    equipment.value = await listEquipment()
  } catch {
    loadError.value = 'Não foi possível carregar os equipamentos. Tente novamente.'
  } finally {
    loading.value = false
  }
}

async function save(): Promise<void> {
  if (saving.value) return
  formError.value = ''
  successMessage.value = ''
  const input = createEquipmentSchema.safeParse({
    name: name.value,
    ...(description.value.trim() && { description: description.value })
  })
  if (!input.success) {
    formError.value = input.error.issues[0]?.message ?? 'Confira os dados informados.'
    return
  }

  saving.value = true
  try {
    const created = await createEquipment(input.data)
    equipment.value = [...equipment.value, created].sort((a, b) =>
      a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
    name.value = ''
    description.value = ''
    successMessage.value = 'Equipamento cadastrado com sucesso.'
  } catch {
    formError.value = 'Não foi possível cadastrar o equipamento. Tente novamente.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="container">
    <a class="back-link" href="/">← Voltar ao início</a>
    <p class="eyebrow">RESERVA LAB</p>
    <h1>Equipamentos</h1>
    <p class="description">Cadastre e consulte os equipamentos disponíveis para reserva.</p>

    <section class="card" aria-labelledby="create-title">
      <h2 id="create-title">Cadastrar equipamento</h2>
      <form @submit.prevent="save">
        <label for="equipment-name">Nome</label>
        <input id="equipment-name" v-model="name" name="name" required maxlength="150" :disabled="saving" />
        <label for="equipment-description">Descrição <span class="optional">(opcional)</span></label>
        <textarea id="equipment-description" v-model="description" name="description" maxlength="1000" rows="3" :disabled="saving" />
        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <p v-if="successMessage" class="success" role="status">{{ successMessage }}</p>
        <button type="submit" :disabled="saving">{{ saving ? 'Salvando...' : 'Cadastrar' }}</button>
      </form>
    </section>

    <section class="card" aria-labelledby="list-title">
      <div class="section-heading">
        <h2 id="list-title">Equipamentos cadastrados</h2>
        <button class="secondary" type="button" :disabled="loading" @click="load">Atualizar lista</button>
      </div>
      <p v-if="loading" role="status">Carregando equipamentos...</p>
      <div v-else-if="loadError" role="alert">
        <p class="error">{{ loadError }}</p>
        <button type="button" @click="load">Tentar novamente</button>
      </div>
      <p v-else-if="equipment.length === 0" role="status">Nenhum equipamento cadastrado ainda.</p>
      <ul v-else class="equipment-list">
        <li v-for="item in equipment" :key="item.id">
          <strong>{{ item.name }}</strong>
          <p v-if="item.description">{{ item.description }}</p>
        </li>
      </ul>
    </section>
  </main>
</template>
