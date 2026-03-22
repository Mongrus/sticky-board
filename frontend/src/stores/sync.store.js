import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSyncStore = defineStore('sync', () => {
  const syncStatus = ref('synced')
  const networkOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  /** Пока тянем/ресайзим стикер — не подставлять x,y,w,h,z с сервера (pull иначе затирает стор до pointerup). */
  const boardLayoutGestureToken = ref(null)

  function setBoardLayoutGestureToken(token) {
    boardLayoutGestureToken.value = token
  }

  function setNetworkOnline(value) {
    networkOnline.value = value
    if (!value) {
      syncStatus.value = 'offline'
    } else if (syncStatus.value === 'offline') {
      syncStatus.value = 'synced'
    }
  }

  function setSyncing() {
    syncStatus.value = 'syncing'
  }

  function setSynced() {
    syncStatus.value = 'synced'
  }

  function setError() {
    syncStatus.value = 'error'
  }

  return {
    syncStatus,
    networkOnline,
    boardLayoutGestureToken,
    setBoardLayoutGestureToken,
    setNetworkOnline,
    setSyncing,
    setSynced,
    setError
  }
})
