import { STICKERS_STORE_GUEST_KEY } from '@/constants/storage.constants'

/**
 * Смена ключа localStorage: выход на гостя — не перезатираем гостевой снимок гидратацией.
 */
export function isLoggingOutToGuest(nextKey, prevKey, guestKey = STICKERS_STORE_GUEST_KEY) {
  return nextKey === guestKey && prevKey !== guestKey
}
