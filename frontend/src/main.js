import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useMainStore } from '@/stores/main.store'
import { useAuthStore } from '@/stores/auth.store'
import {
  getStickersStoreLocalStorageKey,
  STICKERS_STORE_GUEST_KEY,
  migrateLegacyStickersStore
} from '@/constants/storage.constants'
import { isLoggingOutToGuest } from '@/utils/stickersPersistenceContext'
import {
  runAuthenticatedBoardSync,
  clearStickerRemotePatchTimers,
  initStickersSyncLifecycle
} from '@/services/stickersRemoteSync'
import { flushOutboxPersistence, invalidateOutboxCache } from '@/services/stickersOutbox'
import { useSyncStore } from '@/stores/sync.store'
import router from './router'
import App from './App.vue'

import './assets/reset.css'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
const syncStore = useSyncStore()
await authStore.refreshSession()

syncStore.setNetworkOnline(typeof navigator !== 'undefined' && navigator.onLine)

migrateLegacyStickersStore()

const store = useMainStore()

let persistTimeout = null
let lastStickersPersistKey = getStickersStoreLocalStorageKey(authStore)

store.hydrateFromLocalStorageKey(lastStickersPersistKey)

let prevAuthed = authStore.isAuthenticated
if (authStore.isAuthenticated) {
  void runAuthenticatedBoardSync()
}

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

  const prevKey = lastStickersPersistKey
  flushStickersToKey(prevKey)
  invalidateOutboxCache()

  const loggingOutToGuest = isLoggingOutToGuest(nextKey, prevKey)

  if (loggingOutToGuest) {
    clearTimeout(persistTimeout)
    persistStore(store.$state, STICKERS_STORE_GUEST_KEY)
    lastStickersPersistKey = nextKey
    return
  }

  lastStickersPersistKey = nextKey
  store.hydrateFromLocalStorageKey(nextKey)
}

store.$subscribe((_, state) => {
  clearTimeout(persistTimeout)
  persistTimeout = setTimeout(() => persistStore(state), 200)
})

authStore.$subscribe(() => {
  switchStickersPersistenceContext()
  const now = authStore.isAuthenticated
  if (now && !prevAuthed) {
    const mergedGuest = store.mergeGuestBoardLwwIntoUserStore()
    if (mergedGuest) {
      clearTimeout(persistTimeout)
      persistStore(store.$state, lastStickersPersistKey)
    }
    void runAuthenticatedBoardSync()
  } else if (!now) {
    clearStickerRemotePatchTimers()
  }
  prevAuthed = now
})

window.addEventListener('pagehide', () => {
  clearTimeout(persistTimeout)
  persistStore(store.$state, lastStickersPersistKey)
  flushOutboxPersistence(authStore)
})

initStickersSyncLifecycle()

app.mount('#app')
