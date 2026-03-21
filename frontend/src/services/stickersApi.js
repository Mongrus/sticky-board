import { apiRequest } from '@/services/laravelApi'

export async function apiStickersList(params = {}) {
  const q = new URLSearchParams()
  if (params.since) q.set('since', params.since)
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const res = await apiRequest(`/api/stickers${suffix}`, { method: 'GET' })
  return { res, data: res.ok ? await res.json() : null }
}

export async function apiStickersRemovedSince(since) {
  const q = new URLSearchParams({ since })
  const res = await apiRequest(`/api/stickers/removed?${q.toString()}`, { method: 'GET' })
  return { res, data: res.ok ? await res.json() : null }
}

export async function apiStickerCreate(body) {
  const res = await apiRequest('/api/stickers', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  const data = res.ok ? await res.json() : null
  return { res, sticker: data?.sticker ?? null }
}

export async function apiStickerPatch(uuid, body) {
  const res = await apiRequest(`/api/stickers/${uuid}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
  const data = res.ok ? await res.json() : null
  return { res, sticker: data?.sticker ?? null }
}

export async function apiStickerDelete(uuid) {
  return apiRequest(`/api/stickers/${uuid}`, { method: 'DELETE' })
}
