import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useMainStore } from '@/stores/main.store'
import router from './router'
import App from './App.vue'

import './assets/reset.css'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const store = useMainStore()

store.$subscribe((_, state) => {
  localStorage.setItem('stickers-store', JSON.stringify({
    stickers: state.stickers,
    nextId: state.nextId,
    settings: state.settings,
    cookiesConfirmed: state.cookiesConfirmed
  }))
})

app.mount('#app')