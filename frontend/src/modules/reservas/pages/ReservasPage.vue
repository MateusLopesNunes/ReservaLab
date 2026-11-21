<script setup lang="ts">
import { useEquipmentOptions } from '../composables/useEquipmentOptions'
import { useReservationAgenda } from '../composables/useReservationAgenda'
import { useReservationForm } from '../composables/useReservationForm'

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const displayDate = new Intl.DateTimeFormat('pt-BR', { timeZone, dateStyle: 'short', timeStyle: 'short' })
const equipment = useEquipmentOptions()
const agenda = useReservationAgenda()
const form = useReservationForm(agenda, timeZone)
const { options, loading: loadingEquipment, error: equipmentError, load: loadEquipment } = equipment
const { equipmentId, reservations, loading: loadingAgenda, error: agendaError, refresh: refreshAgenda } = agenda
const { startsAt, endsAt, saving, error: formError, success, submit } = form

function formatTime(value: string): string {
  return displayDate.format(new Date(value))
}
</script>

<template>
  <main class="container">
    <h1>Reservas</h1>
    <p class="description" id="reservation-time-zone">Os horários seguem o fuso {{ timeZone }}.</p>

    <section class="card" aria-labelledby="reservation-form-title">
      <h2 id="reservation-form-title">Criar reserva</h2>
      <p v-if="loadingEquipment" role="status">Carregando equipamentos...</p>
      <div v-else-if="equipmentError">
        <p class="error" role="alert">{{ equipmentError }}</p>
        <button class="secondary" type="button" @click="loadEquipment">Tentar novamente</button>
      </div>
      <div v-else-if="options.length === 0">
        <p role="status">Nenhum equipamento cadastrado.</p>
        <a href="/equipamentos">Ir para Equipamentos</a>
      </div>
      <form v-else @submit.prevent="submit">
        <label for="reservation-equipment">Equipamento</label>
        <select id="reservation-equipment" v-model="equipmentId" required>
          <option value="" disabled>Selecione um equipamento</option>
          <option v-for="item in options" :key="item.id" :value="item.id">{{ item.name }}</option>
        </select>

        <label for="reservation-start">Início</label>
        <input id="reservation-start" v-model="startsAt" type="datetime-local"
          aria-describedby="reservation-time-zone" required :disabled="saving || !equipmentId" />
        <label for="reservation-end">Fim</label>
        <input id="reservation-end" v-model="endsAt" type="datetime-local"
          aria-describedby="reservation-time-zone" required :disabled="saving || !equipmentId" />

        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <p v-if="success" class="success" role="status">{{ success }}</p>
        <button type="submit" :disabled="saving || !equipmentId">{{ saving ? 'Reservando...' : 'Reservar' }}</button>
      </form>
    </section>

    <section v-if="equipmentId" class="card" aria-labelledby="reservation-agenda-title">
      <div class="section-heading">
        <h2 id="reservation-agenda-title">Agenda do equipamento</h2>
        <button class="secondary" type="button" :disabled="loadingAgenda" @click="refreshAgenda">Atualizar agenda</button>
      </div>
      <p v-if="loadingAgenda" role="status">Carregando agenda...</p>
      <p v-else-if="agendaError" class="error" role="alert">{{ agendaError }}</p>
      <p v-else-if="reservations.length === 0" role="status">Nenhuma reserva em andamento ou futura.</p>
      <ul v-else class="equipment-list">
        <li v-for="item in reservations" :key="item.id">
          <time :datetime="item.startsAt">{{ formatTime(item.startsAt) }}</time>
          <span> até </span>
          <time :datetime="item.endsAt">{{ formatTime(item.endsAt) }}</time>
          <p v-if="item.isMine">Sua reserva</p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #b8cbd3;
  border-radius: 6px;
  background: white;
  color: inherit;
  font: inherit;
}
select:focus-visible { outline: 3px solid #e7a833; outline-offset: 2px; }
</style>
