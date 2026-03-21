import { getOutboxStorageKey } from '@/constants/storage.constants'
import { generateStickerToken } from '@/utils/stickerIdentity'

let cacheKey = null
let cacheList = null
let persistTimer = null

const PERSIST_DEBOUNCE_MS = 150

function readFromDisk(authStore) {
  const key = getOutboxStorageKey(authStore)
  if (!key) return { key: null, list: [] }
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    return { key, list: Array.isArray(list) ? list : [] }
  } catch {
    return { key, list: [] }
  }
}

function getList(authStore) {
  const key = getOutboxStorageKey(authStore)
  if (!key) {
    return []
  }
  if (cacheKey !== key) {
    const { list } = readFromDisk(authStore)
    cacheKey = key
    cacheList = list
  }
  return cacheList
}

function persistSoon(authStore) {
  const key = getOutboxStorageKey(authStore)
  if (!key) return
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    if (key && cacheList) {
      localStorage.setItem(key, JSON.stringify(cacheList))
    }
  }, PERSIST_DEBOUNCE_MS)
}

function persistNow(authStore) {
  const key = getOutboxStorageKey(authStore)
  clearTimeout(persistTimer)
  persistTimer = null
  if (!key || !cacheList) return
  localStorage.setItem(key, JSON.stringify(cacheList))
}

export function invalidateOutboxCache() {
  cacheKey = null
  cacheList = null
  clearTimeout(persistTimer)
  persistTimer = null
}

export function flushOutboxPersistence(authStore) {
  persistNow(authStore)
}

export function loadOutboxOps(authStore) {
  return [...getList(authStore)]
}

function baseOp(type, token, payload) {
  const id = generateStickerToken()
  return {
    id,
    type,
    token,
    payload,
    clientMutationId: generateStickerToken(),
    createdAt: new Date().toISOString()
  }
}

export function enqueueOutboxOp(authStore, op) {
  if (!getOutboxStorageKey(authStore)) return
  getList(authStore)
  let next = [...cacheList]

  if (op.type === 'delete') {
    next = next.filter((o) => o.token !== op.token)
    next.push(op)
  } else if (op.type === 'update') {
    next = next.filter((o) => !(o.type === 'update' && o.token === op.token))
    next.push(op)
  } else if (op.type === 'create') {
    next = next.filter((o) => !(o.type === 'create' && o.token === op.token))
    next.push(op)
  } else {
    next.push(op)
  }

  cacheList = next
  persistSoon(authStore)
}

export function enqueueOutboxCreate(authStore, payload) {
  const token = payload?.uuid
  if (!token) return
  enqueueOutboxOp(authStore, baseOp('create', token, payload))
}

export function enqueueOutboxUpdate(authStore, token, payload) {
  enqueueOutboxOp(authStore, { ...baseOp('update', token, payload) })
}

export function enqueueOutboxDelete(authStore, token) {
  enqueueOutboxOp(authStore, { ...baseOp('delete', token, undefined) })
}

export function removeOutboxOpById(authStore, opId) {
  if (!getOutboxStorageKey(authStore)) return
  getList(authStore)
  cacheList = cacheList.filter((o) => o.id !== opId)
  persistSoon(authStore)
}

export function clearOutbox(authStore) {
  const key = getOutboxStorageKey(authStore)
  if (!key) return
  cacheList = []
  localStorage.setItem(key, '[]')
  cacheKey = key
}
