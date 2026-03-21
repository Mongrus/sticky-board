import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AUTH_MODE_GUEST, AUTH_MODE_AUTHENTICATED } from '@/constants/auth.constants'
import { apiUser } from '@/services/laravelApi'

export const useAuthStore = defineStore('auth', () => {
  const authMode = ref(AUTH_MODE_GUEST)
  const user = ref(null)

  const isGuest = computed(() => authMode.value === AUTH_MODE_GUEST)
  const isAuthenticated = computed(() => authMode.value === AUTH_MODE_AUTHENTICATED)

  function setGuest() {
    authMode.value = AUTH_MODE_GUEST
    user.value = null
  }

  function setAuthenticated(userPayload) {
    authMode.value = AUTH_MODE_AUTHENTICATED
    user.value = userPayload
  }

  async function refreshSession() {
    try {
      const res = await apiUser()
      if (res.ok) {
        const data = await res.json()
        if (data?.user) {
          setAuthenticated(data.user)
          return
        }
      }
      setGuest()
    } catch {
      setGuest()
    }
  }

  return {
    authMode,
    user,
    isGuest,
    isAuthenticated,
    setGuest,
    setAuthenticated,
    refreshSession
  }
})
