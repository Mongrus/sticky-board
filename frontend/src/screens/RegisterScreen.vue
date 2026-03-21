<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { apiRegister } from '@/services/laravelApi'
import { useAuthStore } from '@/stores/auth.store'
import { WELCOME_STORAGE_KEY } from '@/constants/app.constants'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const busy = ref(false)

const canSubmit = computed(
  () =>
    name.value.trim().length > 0 &&
    email.value.trim().length > 0 &&
    password.value.length > 0 &&
    password.value === passwordConfirmation.value &&
    !busy.value
)

async function submit() {
  if (!canSubmit.value) return
  busy.value = true
  error.value = ''
  try {
    const res = await apiRegister({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value
    })
    let data = {}
    try {
      data = await res.json()
    } catch {}
    if (!res.ok) {
      const msg =
        data?.message ||
        Object.values(data?.errors || {})
          .flat()
          .filter(Boolean)[0]
      error.value = msg || `Ошибка регистрации (${res.status})`
      return
    }
    if (data?.user) {
      authStore.setAuthenticated(data.user)
    }
    router.push('/board')
  } catch (e) {
    error.value =
      typeof e?.message === 'string' && e.message.length > 0
        ? e.message
        : 'Нет соединения с сервером'
  } finally {
    busy.value = false
  }
}

function continueAsGuest() {
  localStorage.setItem(WELCOME_STORAGE_KEY, 'true')
  router.push('/board')
}
</script>

<template>
  <div class="auth-screen">
    <div class="auth-screen__card">
      <h1 class="auth-screen__title">Регистрация</h1>
      <p class="auth-screen__hint">Создайте аккаунт — доска будет сохраняться в облаке.</p>

      <form class="auth-screen__form" @submit.prevent="submit">
        <label class="auth-screen__label">
          Имя
          <input v-model="name" type="text" autocomplete="name" required />
        </label>
        <label class="auth-screen__label">
          Email
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label class="auth-screen__label">
          Пароль
          <input v-model="password" type="password" autocomplete="new-password" required />
        </label>
        <label class="auth-screen__label">
          Пароль ещё раз
          <input v-model="passwordConfirmation" type="password" autocomplete="new-password" required />
        </label>
        <p v-if="error" class="auth-screen__error">{{ error }}</p>
        <button type="submit" class="auth-screen__submit" :disabled="!canSubmit">
          {{ busy ? 'Регистрация…' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="auth-screen__links">
        <RouterLink to="/login">Уже есть аккаунт</RouterLink>
        <span class="auth-screen__dot">·</span>
        <button type="button" class="auth-screen__linkish" @click="continueAsGuest">
          Продолжить как гость
        </button>
      </p>
      <p class="auth-screen__back">
        <RouterLink to="/">← На главную</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped lang="sass">
.auth-screen
  min-height: 100%
  display: flex
  align-items: center
  justify-content: center
  padding: 24px 16px
  background: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)
  background-size: 20px 20px

.auth-screen__card
  width: 100%
  max-width: 400px
  padding: 28px 24px
  border-radius: 16px
  background: #fff
  box-shadow: 0 8px 32px rgba(0,0,0,0.08)
  border: 1px solid rgba(0,0,0,0.06)

.auth-screen__title
  margin: 0 0 8px
  font-size: 26px
  font-weight: 600

.auth-screen__hint
  margin: 0 0 20px
  font-size: 14px
  color: #666
  line-height: 1.5

.auth-screen__form
  display: flex
  flex-direction: column
  gap: 14px

.auth-screen__label
  display: flex
  flex-direction: column
  gap: 6px
  font-size: 13px
  color: #444
  input
    padding: 10px 12px
    border-radius: 10px
    border: 1px solid #ddd
    font-size: 15px

.auth-screen__error
  margin: 0
  font-size: 13px
  color: #c62828

.auth-screen__submit
  margin-top: 8px
  padding: 12px 16px
  border: none
  border-radius: 10px
  background: #5c9cff
  color: #fff
  font-weight: 600
  font-size: 15px
  cursor: pointer
  &:disabled
    opacity: 0.55
    cursor: not-allowed

.auth-screen__links
  margin: 20px 0 0
  font-size: 14px
  text-align: center
  a
    color: #5c9cff
    text-decoration: none
    &:hover
      text-decoration: underline

.auth-screen__dot
  margin: 0 8px
  color: #999

.auth-screen__linkish
  background: none
  border: none
  padding: 0
  font: inherit
  color: #5c9cff
  cursor: pointer
  text-decoration: underline

.auth-screen__back
  margin: 16px 0 0
  text-align: center
  font-size: 14px
  a
    color: #666
</style>
