export const STICKERS_STORE_LEGACY_KEY = 'stickers-store'

export const STICKERS_STORE_GUEST_KEY = 'stickers-store-guest'

export function getStickersStoreLocalStorageKey(authStore) {
  if (authStore.isAuthenticated && authStore.user?.id != null) {
    return `stickers-store-user-${authStore.user.id}`
  }
  return STICKERS_STORE_GUEST_KEY
}

export function getOutboxStorageKey(authStore) {
  if (authStore.isAuthenticated && authStore.user?.id != null) {
    return `stycky-outbox-user-${authStore.user.id}`
  }
  return null
}

export function getPullWatermarkStorageKey(authStore) {
  if (authStore.isAuthenticated && authStore.user?.id != null) {
    return `stycky-pull-watermark-user-${authStore.user.id}`
  }
  return null
}

/** Сигнал полной очистки доски на сервере (`users.stickers_board_epoch`). */
export function getBoardEpochStorageKey(authStore) {
  if (authStore.isAuthenticated && authStore.user?.id != null) {
    return `stycky-board-epoch-user-${authStore.user.id}`
  }
  return null
}

export function migrateLegacyStickersStore() {
  if (typeof window === 'undefined') return
  const legacy = localStorage.getItem(STICKERS_STORE_LEGACY_KEY)
  if (!legacy) return
  if (!localStorage.getItem(STICKERS_STORE_GUEST_KEY)) {
    localStorage.setItem(STICKERS_STORE_GUEST_KEY, legacy)
  }
  localStorage.removeItem(STICKERS_STORE_LEGACY_KEY)
}
