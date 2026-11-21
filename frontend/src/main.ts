import { createApp } from 'vue'
import StatusPage from './modules/status/pages/StatusPage.vue'
import EquipamentosPage from './modules/equipamentos/pages/EquipamentosPage.vue'
import './style.css'

const page = window.location.pathname === '/equipamentos' ? EquipamentosPage : StatusPage
createApp(page).mount('#app')
