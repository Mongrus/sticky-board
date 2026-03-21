/** @deprecated Старый единый ключ; данные переносятся в STICKERS_STORE_GUEST_KEY при первом запуске */
export const STICKERS_STORE_LEGACY_KEY = 'stickers-store'

/** Доска в режиме гостя (не смешивается с данными аккаунта) */
export const STICKERS_STORE_GUEST_KEY = 'stickers-store-guest'

/** @param {{ isAuthenticated: boolean, user: { id?: number } | null }} authStore */
export function getStickersStoreLocalStorageKey(authStore) {
  if (authStore.isAuthenticated && authStore.user?.id != null) {
    return `stickers-store-user-${authStore.user.id}`
  }
  return STICKERS_STORE_GUEST_KEY
}

/**
 * Однократно копирует данные из legacy-ключа в гостевой, затем удаляет legacy.
 */
export function migrateLegacyStickersStore() {
  if (typeof window === 'undefined') return
  const legacy = localStorage.getItem(STICKERS_STORE_LEGACY_KEY)
  if (!legacy) return
  if (!localStorage.getItem(STICKERS_STORE_GUEST_KEY)) {
    localStorage.setItem(STICKERS_STORE_GUEST_KEY, legacy)
  }
  localStorage.removeItem(STICKERS_STORE_LEGACY_KEY)
}
