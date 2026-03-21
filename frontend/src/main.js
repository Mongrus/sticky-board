import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useMainStore } from '@/stores/main.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  getStickersStoreLocalStorageKey,
  migrateLegacyStickersStore
} from '@/constants/storage.constants'
import router from './router'
import App from './App.vue'

import './assets/reset.css'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
await authStore.refreshSession()

migrateLegacyStickersStore()

const store = useMainStore()

let persistTimeout = null
let lastStickersPersistKey = getStickersStoreLocalStorageKey(authStore)

store.hydrateFromLocalStorageKey(lastStickersPersistKey)

function persistStore(state, key) {
  const storageKey = key ?? getStickersStoreLocalStorageKey(authStore)
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      stickers: state.stickers,
      nextId: state.nextId,
      settings: state.settings,
      cookiesConfirmed: state.cookiesConfirmed
    })
  )
}

function flushStickersToKey(key) {
  clearTimeout(persistTimeout)
  persistStore(store.$state, key)
}

function switchStickersPersistenceContext() {
  const nextKey = getStickersStoreLocalStorageKey(authStore)
  if (nextKey === lastStickersPersistKey) return
  flushStickersToKey(lastStickersPersistKey)
  lastStickersPersistKey = nextKey
  store.hydrateFromLocalStorageKey(nextKey)
}

store.$subscribe((_, state) => {
  clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => persistStore(state), 200)
})

authStore.$subscribe(() => {
  switchStickersPersistenceContext()
})

window.addEventListener('pagehide', () => {
  clearTimeout(persistTimeout)
  persistStore(store.$state, lastStickersPersistKey)
})

app.mount('#app')
