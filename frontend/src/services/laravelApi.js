const baseUrl = () =>
  (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

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
  const res = await fetch(`${baseUrl()}${path}`, {
    credentials: 'include',
    ...options,
    headers
  })
  return res
}

/** Вызвать перед первым POST (login / register). */
export async function fetchSanctumCsrfCookie() {
  const res = await fetch(`${baseUrl()}/sanctum/csrf-cookie`, {
    credentials: 'include'
  })
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

export { baseUrl }
