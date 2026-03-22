import { STICKER } from '@/constants/sticker.constants'
import { getPullWatermarkStorageKey } from '@/constants/storage.constants'
import { useAuthStore } from '@/stores/auth.store'
import { useSyncStore } from '@/stores/sync.store'
import {
  apiStickersList,
  apiStickersRemovedSince,
  apiStickerCreate,
  apiStickerPatch,
  apiStickerDelete
} from '@/services/stickersApi'
import {
  loadOutboxOps,
  enqueueOutboxCreate,
  enqueueOutboxUpdate,
  enqueueOutboxDelete,
  removeOutboxOpById,
  flushOutboxPersistence
} from '@/services/stickersOutbox'

/** Нижняя граница для /stickers/removed, если ещё нет watermark (учёт чужих удалений при первом merge). */
const REMOVED_SINCE_EPOCH = '1970-01-01T00:00:00.000Z'

/** Токены стикеров: локальная геометрия ещё не подтверждена PATCH — не затирать x,y,w,h,z из pull (рассинхрон часов клиент/сервер). */
const pendingLayoutSyncTokens = new Set()

function markLayoutSyncPending(token) {
  if (STICKER.SYNC_INCLUDE_LAYOUT && token) pendingLayoutSyncTokens.add(token)
}

function clearLayoutSyncPending(token) {
  if (token) pendingLayoutSyncTokens.delete(token)
}

function shouldSkipLayoutFromServer(local) {
  if (!STICKER.SYNC_INCLUDE_LAYOUT || !local?.token) return false
  if (pendingLayoutSyncTokens.has(local.token)) return true
  const sync = useSyncStore()
  return sync.boardLayoutGestureToken === local.token
}

/** Вариант A: пока тянем/ресайзим стикер — не merge и не PATCH из pull (иначе уходит снимок стора с устаревшей геометрией). */
function isBoardLayoutGestureActiveForToken(token) {
  if (!token) return false
  const sync = useSyncStore()
  return sync.boardLayoutGestureToken === token
}

/** Вариант B: не начинать/не применять инкрементальный pull, пока на доске активен drag или resize (нет гонки с таймером). */
function isAnyBoardLayoutGestureActive() {
  const t = useSyncStore().boardLayoutGestureToken
  return t != null && t !== ''
}

function isBoardTextEditActiveForToken(token) {
  if (!token) return false
  const sync = useSyncStore()
  return sync.boardTextEditToken === token
}

async function getMainStore() {
  const { useMainStore } = await import('@/stores/main.store')
  return useMainStore()
}

function readWatermark(authStore) {
  const key = getPullWatermarkStorageKey(authStore)
  if (!key) return ''
  return localStorage.getItem(key) || ''
}

function writeWatermark(authStore, iso) {
  const key = getPullWatermarkStorageKey(authStore)
  if (!key || !iso) return
  localStorage.setItem(key, iso)
}

function bumpWatermarkFromServerRows(authStore, serverRows) {
  if (!serverRows?.length) return
  const prev = readWatermark(authStore)
  let max = prev ? Date.parse(prev) : 0
  if (Number.isNaN(max)) max = 0
  for (const s of serverRows) {
    const t = Date.parse(s.updated_at)
    if (!Number.isNaN(t) && t > max) max = t
  }
  if (max > 0) {
    writeWatermark(authStore, new Date(max).toISOString())
  }
}

function bumpWatermarkFromLocalIfStillEmpty(authStore, stickerStore) {
  if (readWatermark(authStore)) return
  let max = 0
  for (const s of stickerStore.stickers) {
    const t = parseIsoMs(s.updated_at)
    if (t > max) max = t
  }
  if (max > 0) {
    writeWatermark(authStore, new Date(max).toISOString())
    return
  }
  if (stickerStore.stickers.length > 0) {
    writeWatermark(authStore, new Date().toISOString())
  }
}

function bumpWatermarkCombined(authStore, stickerRows, removedRows) {
  const prev = readWatermark(authStore)
  let max = prev ? Date.parse(prev) : 0
  if (Number.isNaN(max)) max = 0
  for (const s of stickerRows || []) {
    const t = Date.parse(s.updated_at)
    if (!Number.isNaN(t) && t > max) max = t
  }
  for (const r of removedRows || []) {
    const t = Date.parse(r.deleted_at)
    if (!Number.isNaN(t) && t > max) max = t
  }
  if (max > 0) {
    writeWatermark(authStore, new Date(max).toISOString())
  }
}

function parseIsoMs(iso) {
  if (!iso) return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function compareUpdatedAt(a, b) {
  return parseIsoMs(a) - parseIsoMs(b)
}

/** API Laravel: x,y,w,h,z — integer и границы; с пикселей часто приходят float → 422. */
function layoutFieldsForApi(sticker) {
  const x = Math.round(Number(sticker.x))
  const y = Math.round(Number(sticker.y))
  const w = Math.max(50, Math.min(4000, Math.round(Number(sticker.w))))
  const h = Math.max(50, Math.min(4000, Math.round(Number(sticker.h))))
  const z = Math.max(0, Math.min(2147483647, Math.round(Number(sticker.z ?? 0))))
  return {
    x: Math.max(-100000, Math.min(100000, x)),
    y: Math.max(-100000, Math.min(100000, y)),
    w,
    h,
    z
  }
}

function contentPayloadFromLocal(sticker) {
  const o = {
    text: sticker.text ?? '',
    folded: !!sticker.folded,
    bc: sticker.bc,
    font: sticker.font,
    fs: sticker.fs,
    tc: sticker.tc
  }
  if (STICKER.SYNC_INCLUDE_LAYOUT) {
    Object.assign(o, layoutFieldsForApi(sticker))
  }
  return o
}

function postPayloadFromLocal(sticker) {
  return {
    uuid: sticker.token,
    ...contentPayloadFromLocal(sticker)
  }
}

function applyServerContentToLocal(local, remote, options = {}) {
  const skipLayout = Boolean(options.skipLayout)
  local.text = remote.text ?? ''
  local.folded = !!remote.folded
  local.bc = remote.bc
  local.font = remote.font
  local.fs = remote.fs
  local.tc = remote.tc
  if (STICKER.SYNC_INCLUDE_LAYOUT && !skipLayout) {
    local.x = remote.x
    local.y = remote.y
    local.w = remote.w
    local.h = remote.h
    local.z = remote.z
  }
}

/**
 * После успешного PATCH, который мы сами отправили: не подставлять x,y,w,z с сервера —
 * иначе округление/эхо API даёт 1px рывок после drag. Геометрия уже в стикере; сервер совпадает с payload.
 */
function applyServerContentFromOwnPatchResponse(local, remote) {
  if (isBoardTextEditActiveForToken(local.token)) {
    return
  }
  applyServerContentToLocal(local, remote, { skipLayout: STICKER.SYNC_INCLUDE_LAYOUT })
}

/** Привести локальную геометрию к тем же int/clamp, что уходят в API (убирает субпиксель и 422). */
export function snapStickerLayoutInPlace(sticker) {
  if (!STICKER.SYNC_INCLUDE_LAYOUT || !sticker) return
  const L = layoutFieldsForApi(sticker)
  sticker.x = L.x
  sticker.y = L.y
  sticker.w = L.w
  sticker.h = L.h
  sticker.z = L.z
}

function applyServerMeta(local, remote) {
  local.updated_at = remote.updated_at
}

function serverStickerToLocal(remote, numericId) {
  return {
    id: numericId,
    token: remote.uuid,
    updated_at: remote.updated_at,
    text: remote.text ?? '',
    folded: !!remote.folded,
    bc: remote.bc,
    font: remote.font,
    fs: remote.fs,
    tc: remote.tc,
    x: remote.x,
    y: remote.y,
    w: remote.w,
    h: remote.h,
    z: remote.z
  }
}

const patchTimers = new Map()

export function clearStickerRemotePatchTimers() {
  for (const t of patchTimers.values()) {
    clearTimeout(t)
  }
  patchTimers.clear()
  pendingLayoutSyncTokens.clear()
  const sync = useSyncStore()
  sync.setBoardLayoutGestureToken(null)
  sync.setBoardTextEditToken(null)
}

function isRemoteSyncAllowed() {
  const auth = useAuthStore()
  const sync = useSyncStore()
  return auth.isAuthenticated && sync.networkOnline
}

export function scheduleStickerRemotePatch(token, { layoutChange = false } = {}) {
  const auth = useAuthStore()
  if (!auth.isAuthenticated || !token) return

  if (layoutChange) markLayoutSyncPending(token)

  const existing = patchTimers.get(token)
  if (existing) clearTimeout(existing)

  patchTimers.set(
    token,
    setTimeout(() => {
      patchTimers.delete(token)
      void flushStickerPatch(token)
    }, STICKER.REMOTE_PATCH_DEBOUNCE_MS)
  )
}

/** Сразу отправить PATCH (без debounce). Для drag/resize после pointerup. */
export function flushStickerRemotePatchNow(token) {
  if (!token) return
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return

  markLayoutSyncPending(token)
  const existing = patchTimers.get(token)
  if (existing) {
    clearTimeout(existing)
    patchTimers.delete(token)
  }
  void flushStickerPatch(token)
}

async function flushStickerPatch(token) {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return

  const store = await getMainStore()
  const sticker = store.stickers.find((s) => s.token === token)
  if (!sticker) return

  if (!isRemoteSyncAllowed()) {
    enqueueOutboxUpdate(auth, token, contentPayloadFromLocal(sticker))
    return
  }

  const { res, sticker: remote } = await apiStickerPatch(token, contentPayloadFromLocal(sticker))
  if (res.ok && remote?.updated_at) {
    sticker.updated_at = remote.updated_at
    applyServerContentFromOwnPatchResponse(sticker, remote)
    clearLayoutSyncPending(token)
    bumpWatermarkFromServerRows(auth, [remote])
  } else if (!res.ok && res.status >= 500) {
    enqueueOutboxUpdate(auth, token, contentPayloadFromLocal(sticker))
    useSyncStore().setError()
  } else if (!res.ok) {
    enqueueOutboxUpdate(auth, token, contentPayloadFromLocal(sticker))
  }
}

export async function pushNewStickerToServer(sticker) {
  const auth = useAuthStore()
  if (!auth.isAuthenticated || !sticker?.token) return

  if (!isRemoteSyncAllowed()) {
    enqueueOutboxCreate(auth, postPayloadFromLocal(sticker))
    return
  }

  const { res, sticker: remote } = await apiStickerCreate(postPayloadFromLocal(sticker))
  if (res.ok && remote?.updated_at) {
    sticker.updated_at = remote.updated_at
    applyServerContentToLocal(sticker, remote)
    bumpWatermarkFromServerRows(auth, [remote])
  } else if (!res.ok) {
    enqueueOutboxCreate(auth, postPayloadFromLocal(sticker))
    if (res.status >= 500) useSyncStore().setError()
  }
}

export async function deleteStickerOnServer(token) {
  const auth = useAuthStore()
  if (!auth.isAuthenticated || !token) return

  if (!isRemoteSyncAllowed()) {
    enqueueOutboxDelete(auth, token)
    return
  }

  const res = await apiStickerDelete(token)
  if (!res.ok && res.status !== 404) {
    enqueueOutboxDelete(auth, token)
    if (res.status >= 500) useSyncStore().setError()
  }
}

let syncChain = Promise.resolve()

export function runAuthenticatedBoardSync() {
  const sync = useSyncStore()
  syncChain = syncChain
    .then(async () => {
      await runAuthenticatedBoardSyncImpl()
      if (sync.syncStatus !== 'error') sync.setSynced()
    })
    .catch(() => sync.setError())
  return syncChain
}

async function processStickersOutbox() {
  const auth = useAuthStore()
  const sync = useSyncStore()
  if (!auth.isAuthenticated || !sync.networkOnline) return

  while (true) {
    const ops = loadOutboxOps(auth)
    if (!ops.length) break
    const op = ops[0]

    if (op.type === 'create') {
      const { res, sticker } = await apiStickerCreate(op.payload)
      if (res.ok) {
        removeOutboxOpById(auth, op.id)
        const store = await getMainStore()
        const loc = store.stickers.find((s) => s.token === op.token)
        if (loc && sticker?.updated_at) {
          loc.updated_at = sticker.updated_at
          applyServerContentToLocal(loc, sticker)
        }
        bumpWatermarkFromServerRows(auth, sticker ? [sticker] : [])
      } else if (res.status === 422) {
        removeOutboxOpById(auth, op.id)
      } else {
        sync.setError()
        break
      }
    } else if (op.type === 'update') {
      const { res, sticker } = await apiStickerPatch(op.token, op.payload)
      if (res.ok) {
        removeOutboxOpById(auth, op.id)
        const store = await getMainStore()
        const loc = store.stickers.find((s) => s.token === op.token)
        if (loc && sticker?.updated_at) {
          loc.updated_at = sticker.updated_at
          applyServerContentFromOwnPatchResponse(loc, sticker)
          clearLayoutSyncPending(op.token)
        }
        bumpWatermarkFromServerRows(auth, sticker ? [sticker] : [])
      } else if (res.status === 404) {
        removeOutboxOpById(auth, op.id)
      } else {
        sync.setError()
        break
      }
    } else if (op.type === 'delete') {
      const res = await apiStickerDelete(op.token)
      if (res.ok || res.status === 404) {
        removeOutboxOpById(auth, op.id)
      } else {
        sync.setError()
        break
      }
    } else {
      removeOutboxOpById(auth, op.id)
    }
  }

  flushOutboxPersistence(auth)
}

async function runIncrementalPullImpl() {
  const auth = useAuthStore()
  const sync = useSyncStore()
  if (!auth.isAuthenticated || !sync.networkOnline) return

  if (isAnyBoardLayoutGestureActive()) {
    return
  }

  const since = readWatermark(auth)
  if (!since) return

  const { res, data } = await apiStickersList({ since })
  const { res: rRem, data: dRem } = await apiStickersRemovedSince(since)

  if (!res.ok && !rRem.ok) return

  if (isAnyBoardLayoutGestureActive()) {
    return
  }

  const store = await getMainStore()
  const rows = res.ok && data?.stickers ? data.stickers : []
  const removedRows = rRem.ok && dRem?.removed ? dRem.removed : []

  if (!rows.length && !removedRows.length) return

  let maxId = store.stickers.reduce((m, s) => Math.max(m, s.id || 0), 0)

  for (const remote of rows) {
    const local = store.stickers.find((s) => s.token === remote.uuid)
    if (!local) {
      maxId += 1
      store.stickers.push(serverStickerToLocal(remote, maxId))
    } else {
      if (isBoardLayoutGestureActiveForToken(local.token)) {
        continue
      }
      if (isBoardTextEditActiveForToken(local.token)) {
        continue
      }
      const cmp = compareUpdatedAt(local.updated_at, remote.updated_at)
      if (cmp < 0) {
        applyServerContentToLocal(local, remote, { skipLayout: shouldSkipLayoutFromServer(local) })
        applyServerMeta(local, remote)
      } else if (cmp > 0) {
        const { res: pr, sticker: updated } = await apiStickerPatch(local.token, contentPayloadFromLocal(local))
        if (pr.ok && updated?.updated_at) {
          local.updated_at = updated.updated_at
          applyServerContentFromOwnPatchResponse(local, updated)
          clearLayoutSyncPending(local.token)
        }
      }
    }
  }

  if (removedRows.length) {
    const gone = new Set(removedRows.map((r) => r.uuid))
    store.stickers = store.stickers.filter(
      (s) =>
        !gone.has(s.token) ||
        isBoardLayoutGestureActiveForToken(s.token) ||
        isBoardTextEditActiveForToken(s.token)
    )
  }

  store.nextId = Math.max(store.nextId, maxId + 1)
  bumpWatermarkCombined(auth, rows, removedRows)
}

function runIncrementalPull() {
  syncChain = syncChain
    .then(() => runIncrementalPullImpl())
    .catch(() => {})
  return syncChain
}

/** Прямой инкрементальный pull (для тестов и при необходимости ручного обновления). */
export async function pullStickersSinceWatermark() {
  await runIncrementalPullImpl()
}

async function runAuthenticatedBoardSyncImpl() {
  const auth = useAuthStore()
  const sync = useSyncStore()
  if (!auth.isAuthenticated || !sync.networkOnline) return

  await processStickersOutbox()

  const { res, data } = await apiStickersList()
  if (!res.ok || !Array.isArray(data?.stickers)) {
    sync.setError()
    return
  }

  const store = await getMainStore()
  const localList = [...store.stickers]

  const serverList = data.stickers
  const gestureT = sync.boardLayoutGestureToken
  const watermarkRows =
    gestureT != null && gestureT !== ''
      ? serverList.filter((s) => s.uuid !== gestureT)
      : [...serverList]
  const serverByUuid = new Map(serverList.map((s) => [s.uuid, s]))

  const sinceForRemoved = readWatermark(auth) || REMOVED_SINCE_EPOCH
  const { res: rRem, data: dRem } = await apiStickersRemovedSince(sinceForRemoved)
  const removedRowsForBump = rRem.ok && Array.isArray(dRem?.removed) ? dRem.removed : []
  const removedUuids = new Set(removedRowsForBump.map((r) => r.uuid))

  const merged = []
  const postQueue = []
  const patchQueue = []

  for (const local of localList) {
    if (local.token && isBoardLayoutGestureActiveForToken(local.token)) {
      merged.push(local)
      continue
    }
    if (local.token && isBoardTextEditActiveForToken(local.token)) {
      merged.push(local)
      continue
    }
    if (local.token && removedUuids.has(local.token)) {
      continue
    }
    const remote = serverByUuid.get(local.token)
    if (!remote) {
      postQueue.push(local)
      merged.push(local)
      continue
    }

    const cmp = compareUpdatedAt(local.updated_at, remote.updated_at)
    if (cmp < 0) {
      applyServerContentToLocal(local, remote, { skipLayout: shouldSkipLayoutFromServer(local) })
      applyServerMeta(local, remote)
      merged.push(local)
    } else if (cmp > 0) {
      patchQueue.push(local)
      merged.push(local)
    } else {
      merged.push(local)
    }
  }

  const seen = new Set(merged.map((s) => s.token))
  let maxId = merged.reduce((m, s) => Math.max(m, s.id || 0), 0)

  for (const remote of serverList) {
    if (seen.has(remote.uuid)) continue
    maxId += 1
    merged.push(serverStickerToLocal(remote, maxId))
    seen.add(remote.uuid)
  }

  const mergedTokens = new Set(merged.map((s) => s.token))
  for (const s of store.stickers) {
    if (mergedTokens.has(s.token)) continue
    if (s.token && removedUuids.has(s.token)) continue
    if (s.token && isBoardLayoutGestureActiveForToken(s.token)) {
      merged.push(s)
      mergedTokens.add(s.token)
      maxId = Math.max(maxId, s.id || 0)
      continue
    }
    if (s.token && isBoardTextEditActiveForToken(s.token)) {
      merged.push(s)
      mergedTokens.add(s.token)
      maxId = Math.max(maxId, s.id || 0)
      continue
    }
    merged.push(s)
    postQueue.push(s)
    mergedTokens.add(s.token)
    maxId = Math.max(maxId, s.id || 0)
  }

  const onServer = new Set(serverList.map((s) => s.uuid))
  const pendingCreateTokens = new Set(
    loadOutboxOps(auth).filter((o) => o.type === 'create').map((o) => o.token)
  )
  const postQueueTokenSet = new Set(postQueue.map((p) => p.token))

  const pruned = merged.filter(
    (local) =>
      onServer.has(local.token) ||
      postQueueTokenSet.has(local.token) ||
      pendingCreateTokens.has(local.token) ||
      isBoardLayoutGestureActiveForToken(local.token) ||
      isBoardTextEditActiveForToken(local.token)
  )

  store.stickers = pruned
  store.nextId = pruned.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1

  for (const local of postQueue) {
    const { res: r, sticker: created } = await apiStickerCreate(postPayloadFromLocal(local))
    if (r.ok && created?.updated_at) {
      local.updated_at = created.updated_at
      applyServerContentToLocal(local, created)
      watermarkRows.push(created)
    }
  }

  for (const local of patchQueue) {
    if (isBoardLayoutGestureActiveForToken(local.token)) {
      continue
    }
    if (isBoardTextEditActiveForToken(local.token)) {
      continue
    }
    const { res: r, sticker: updated } = await apiStickerPatch(local.token, contentPayloadFromLocal(local))
    if (r.ok && updated?.updated_at) {
      local.updated_at = updated.updated_at
      applyServerContentFromOwnPatchResponse(local, updated)
      clearLayoutSyncPending(local.token)
      if (updated) watermarkRows.push(updated)
    }
  }

  bumpWatermarkCombined(auth, watermarkRows, removedRowsForBump)
  bumpWatermarkFromLocalIfStillEmpty(auth, store)
}

function drainRemoteQueueAndResync() {
  const sync = useSyncStore()
  sync.setSyncing()
  syncChain = syncChain
    .then(() => runAuthenticatedBoardSyncImpl())
    .then(() => {
      if (sync.syncStatus === 'error') return Promise.resolve()
      return runIncrementalPullImpl()
    })
    .then(() => {
      if (sync.syncStatus !== 'error') sync.setSynced()
    })
    .catch(() => sync.setError())
  return syncChain
}

let pullTimerId = null

export function initStickersSyncLifecycle() {
  const sync = useSyncStore()

  window.addEventListener('online', () => {
    sync.setNetworkOnline(true)
    drainRemoteQueueAndResync()
  })

  window.addEventListener('offline', () => {
    sync.setNetworkOnline(false)
  })

  const tryPull = () => {
    const auth = useAuthStore()
    if (!auth.isAuthenticated || !sync.networkOnline) return
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    runIncrementalPull()
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tryPull()
  })

  window.addEventListener('focus', tryPull)

  if (pullTimerId) clearInterval(pullTimerId)
  pullTimerId = setInterval(tryPull, STICKER.REMOTE_PULL_INTERVAL_MS)
}
