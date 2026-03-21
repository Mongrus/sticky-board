<script setup>
import { ref } from 'vue'
import {
  baseUrl,
  fetchSanctumCsrfCookie,
  apiRegister,
  apiLogin,
  apiLogout,
  apiUser
} from '@/services/laravelApi'

const lastJson = ref(null)
const lastStatus = ref('')
const error = ref('')
const busy = ref(false)

const regName = ref('Dev User')
const regEmail = ref('dev@example.com')
const regPassword = ref('Password1!')
const regPassword2 = ref('Password1!')

const loginEmail = ref('dev@example.com')
const loginPassword = ref('Password1!')

async function run(label, fn) {
  busy.value = true
  error.value = ''
  lastJson.value = null
  lastStatus.value = ''
  try {
    const res = await fn()
    lastStatus.value = `${label}: ${res.status} ${res.statusText}`
    const text = await res.text()
    try {
      lastJson.value = text ? JSON.parse(text) : null
    } catch {
      lastJson.value = text
    }
    if (!res.ok) {
      error.value = `Ошибка HTTP ${res.status}`
    }
  } catch (e) {
    error.value = e?.message || String(e)
    lastStatus.value = label
  } finally {
    busy.value = false
  }
}

function csrfOnly() {
  return run('GET /sanctum/csrf-cookie', fetchSanctumCsrfCookie)
}

function register() {
  return run('POST /api/register', () =>
    apiRegister({
      name: regName.value,
      email: regEmail.value,
      password: regPassword.value,
      password_confirmation: regPassword2.value
    })
  )
}

function login() {
  return run('POST /api/login', () =>
    apiLogin({
      email: loginEmail.value,
      password: loginPassword.value
    })
  )
}

function logout() {
  return run('POST /api/logout', apiLogout)
}

function user() {
  return run('GET /api/user', apiUser)
}
</script>

<template>
  <div class="dev-auth">
    <p class="dev-auth__warn">
      Только для разработки (маршрут виден при <code>npm run dev</code>).
    </p>
    <p class="dev-auth__api">
      API: <strong>{{ baseUrl() }}</strong>
    </p>

    <section class="dev-auth__block">
      <h2>1. CSRF</h2>
      <button type="button" :disabled="busy" @click="csrfOnly">Получить sanctum/csrf-cookie</button>
    </section>

    <section class="dev-auth__block">
      <h2>2. Регистрация</h2>
      <label>Имя <input v-model="regName" type="text" autocomplete="name" /></label>
      <label>Email <input v-model="regEmail" type="email" autocomplete="email" /></label>
      <label>Пароль <input v-model="regPassword" type="password" autocomplete="new-password" /></label>
      <label>Пароль ещё раз <input v-model="regPassword2" type="password" autocomplete="new-password" /></label>
      <button type="button" :disabled="busy" @click="register">POST /api/register</button>
    </section>

    <section class="dev-auth__block">
      <h2>3. Вход</h2>
      <label>Email <input v-model="loginEmail" type="email" autocomplete="email" /></label>
      <label>Пароль <input v-model="loginPassword" type="password" autocomplete="current-password" /></label>
      <button type="button" :disabled="busy" @click="login">POST /api/login</button>
    </section>

    <section class="dev-auth__block">
      <h2>4. Текущий пользователь</h2>
      <button type="button" :disabled="busy" @click="user">GET /api/user</button>
    </section>

    <section class="dev-auth__block">
      <h2>5. Выход</h2>
      <button type="button" :disabled="busy" @click="logout">POST /api/logout</button>
    </section>

    <p v-if="error" class="dev-auth__err">{{ error }}</p>
    <p v-if="lastStatus" class="dev-auth__status">{{ lastStatus }}</p>
    <pre v-if="lastJson != null" class="dev-auth__pre">{{ JSON.stringify(lastJson, null, 2) }}</pre>

    <p class="dev-auth__back">
      <RouterLink to="/">← На главную</RouterLink>
    </p>
  </div>
</template>

<style scoped lang="sass">
.dev-auth
  max-width: 640px
  margin: 0 auto
  padding: 24px 16px 80px
  font-family: system-ui, sans-serif

.dev-auth__warn
  background: #fff8e1
  border: 1px solid #ffe082
  padding: 10px 12px
  border-radius: 8px
  font-size: 14px

.dev-auth__api
  font-size: 14px
  color: #555
  margin: 12px 0

.dev-auth__block
  margin: 20px 0
  padding: 16px
  background: #f5f8fc
  border-radius: 12px
  border: 1px solid rgba(0,0,0,0.06)

  h2
    margin: 0 0 12px
    font-size: 16px

  label
    display: flex
    flex-direction: column
    gap: 4px
    margin-bottom: 10px
    font-size: 13px
    color: #444

  input
    padding: 8px 10px
    border-radius: 8px
    border: 1px solid #ddd
    max-width: 100%

  button
    margin-top: 8px
    padding: 8px 14px
    border-radius: 8px
    border: none
    background: #5c9cff
    color: #fff
    font-weight: 500
    cursor: pointer
    &:disabled
      opacity: 0.6
      cursor: not-allowed

.dev-auth__err
  color: #c62828
  font-size: 14px

.dev-auth__status
  font-size: 13px
  color: #333

.dev-auth__pre
  margin-top: 12px
  padding: 12px
  background: #1e1e1e
  color: #d4d4d4
  border-radius: 8px
  overflow: auto
  font-size: 12px

.dev-auth__back
  margin-top: 24px
  a
    color: #5c9cff
</style>
