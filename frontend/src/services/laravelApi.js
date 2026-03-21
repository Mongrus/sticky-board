const baseUrl = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return String(raw).replace(/\/$/, '')
}

/** В проде запросы на localhost из браузера пользователя недостижимы, если не задан публичный API. */
function ensureProductionApiConfigured() {
  if (!import.meta.env.PROD) return
  const b = baseUrl()
  if (/localhost|127\.0\.0\.1/.test(b)) {
    throw new Error(
      'Сайт собран без публичного API: при сборке задайте VITE_API_URL = https://ваш-laravel (без / в конце) и пересоберите.'
    )
  }
}

function mapFetchFailure(err) {
  if (import.meta.env.PROD && err instanceof TypeError && String(err.message).includes('fetch')) {
    return new Error(
      'Не удалось связаться с API. Проверьте VITE_API_URL при сборке, что Laravel доступен по HTTPS, CORS и FRONTEND_URL / Sanctum.'
    )
  }
  return err
}

function readXsrfToken() {
  const row = document.cookie.split(';').find((c) => c.trim().startsWith('XSRF-TOKEN='))
  if (!row) return ''
  return decodeURIComponent(row.split('=').slice(1).join('=').trim())
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers
  }
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = readXsrfToken()
  if (token) {
    headers['X-XSRF-TOKEN'] = token
  }
  ensureProductionApiConfigured()
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      credentials: 'include',
      ...options,
      headers
    })
    return res
  } catch (e) {
    throw mapFetchFailure(e)
  }
}

export async function fetchSanctumCsrfCookie() {
  ensureProductionApiConfigured()
  let res
  try {
    res = await fetch(`${baseUrl()}/sanctum/csrf-cookie`, {
      credentials: 'include'
    })
  } catch (e) {
    throw mapFetchFailure(e)
  }
  if (!res.ok) {
    throw new Error(`CSRF cookie: ${res.status} ${res.statusText}`)
  }
  return res
}

export async function apiRegister(payload) {
  await fetchSanctumCsrfCookie()
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiLogin(payload) {
  await fetchSanctumCsrfCookie()
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function apiLogout() {
  await fetchSanctumCsrfCookie()
  return request('/api/logout', { method: 'POST' })
}

export async function apiUser() {
  return request('/api/user', { method: 'GET' })
}

export async function apiRequest(path, options = {}) {
  const method = options.method || 'GET'
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    await fetchSanctumCsrfCookie()
  }
  return request(path, options)
}

export { baseUrl }
