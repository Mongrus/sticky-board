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

let persistTimeout = null
function persistStore(state) {
  localStorage.setItem('stickers-store', JSON.stringify({
    stickers: state.stickers,
    nextId: state.nextId,
    settings: state.settings,
    cookiesConfirmed: state.cookiesConfirmed
  }))
}

store.$subscribe((_, state) => {
  clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => persistStore(state), 200)
})

window.addEventListener('pagehide', () => {
  clearTimeout(persistTimeout)
  if (localStorage.getItem('stickers-store') !== null) {
    persistStore(store.$state)
  }
})

app.mount('#app')
