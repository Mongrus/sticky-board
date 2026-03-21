import { apiLogout } from '@/services/laravelApi'
import { useAuthStore } from '@/stores/auth.store'
import { clearOutbox, flushOutboxPersistence, loadOutboxOps } from '@/services/stickersOutbox'

export async function performLogout() {
  const auth = useAuthStore()
  const pending = loadOutboxOps(auth).length
  if (pending > 0) {
    const ok = window.confirm(
      `В очереди синхронизации ${pending} операций (не ушли на сервер). Они будут удалены. Выйти?`
    )
    if (!ok) return false
  }
  clearOutbox(auth)
  flushOutboxPersistence(auth)
  try {
    await apiLogout()
  } catch {}
  auth.setGuest()
  return true
}
