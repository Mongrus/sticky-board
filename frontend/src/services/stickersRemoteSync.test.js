import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  isAuthenticated: true,
  user: { id: 42 }
}))

const mockSync = vi.hoisted(() => {
  const o = {
    networkOnline: true,
    syncStatus: 'synced',
    boardLayoutGestureToken: null,
    setBoardLayoutGestureToken: vi.fn((token) => {
      o.boardLayoutGestureToken = token
    }),
    boardTextEditToken: null,
    setBoardTextEditToken: vi.fn((token) => {
      o.boardTextEditToken = token
    }),
    setError: vi.fn(() => {
      o.syncStatus = 'error'
    }),
    setSynced: vi.fn(() => {
      o.syncStatus = 'synced'
    }),
    setSyncing: vi.fn(() => {
      o.syncStatus = 'syncing'
    }),
    setNetworkOnline: vi.fn((v) => {
      o.networkOnline = !!v
    })
  }
  return o
})

const mockMain = vi.hoisted(() => ({
  stickers: [],
  nextId: 10,
  mergeGuestBoardLwwIntoUserStore: vi.fn(() => false)
}))

const stickersApiMocks = vi.hoisted(() => ({
  apiStickersList: vi.fn(),
  apiStickersRemovedSince: vi.fn(),
  apiStickerCreate: vi.fn(),
  apiStickerPatch: vi.fn(),
  apiStickerDelete: vi.fn()
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => mockAuth
}))

vi.mock('@/stores/sync.store', () => ({
  useSyncStore: () => mockSync
}))

vi.mock('@/stores/main.store', () => ({
  useMainStore: () => mockMain
}))

vi.mock('@/services/stickersApi', () => stickersApiMocks)

function baseSticker(overrides = {}) {
  return {
    id: 1,
    token: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
    text: 'local',
    folded: false,
    bc: '#FFF9C4',
    font: 'Inter, sans-serif',
    fs: 14,
    tc: '#111',
    x: 0,
    y: 0,
    w: 120,
    h: 80,
    z: 1,
    updated_at: '2025-06-01T12:00:00.000Z',
    ...overrides
  }
}

let pushNewStickerToServer
let deleteStickerOnServer
let runAuthenticatedBoardSync
let scheduleStickerRemotePatch
let clearStickerRemotePatchTimers
let pullStickersSinceWatermark
let initStickersSyncLifecycle

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()

  localStorage.clear()
  mockAuth.isAuthenticated = true
  mockAuth.user = { id: 42 }
  mockSync.networkOnline = true
  mockSync.syncStatus = 'synced'
  mockSync.setBoardLayoutGestureToken(null)
  mockSync.setBoardTextEditToken(null)
  mockMain.stickers.splice(0, mockMain.stickers.length)
  mockMain.nextId = 10

  const outbox = await import('@/services/stickersOutbox')
  outbox.invalidateOutboxCache()

  stickersApiMocks.apiStickersList.mockResolvedValue({
    res: { ok: true, status: 200 },
    data: { stickers: [] }
  })
  stickersApiMocks.apiStickersRemovedSince.mockResolvedValue({
    res: { ok: true, status: 200 },
    data: { removed: [] }
  })
  stickersApiMocks.apiStickerCreate.mockResolvedValue({
    res: { ok: true, status: 201 },
    sticker: {
      uuid: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
      display_id: 1,
      updated_at: '2025-07-01T00:00:00.000Z',
      text: 'srv',
      folded: false
    }
  })
  stickersApiMocks.apiStickerPatch.mockResolvedValue({
    res: { ok: true, status: 200 },
    sticker: {
      display_id: 1,
      updated_at: '2025-07-01T00:00:00.000Z',
      text: 'patched',
      folded: false
    }
  })
  stickersApiMocks.apiStickerDelete.mockResolvedValue({ ok: true, status: 204 })

  const mod = await import('@/services/stickersRemoteSync')
  pushNewStickerToServer = mod.pushNewStickerToServer
  deleteStickerOnServer = mod.deleteStickerOnServer
  runAuthenticatedBoardSync = mod.runAuthenticatedBoardSync
  scheduleStickerRemotePatch = mod.scheduleStickerRemotePatch
  clearStickerRemotePatchTimers = mod.clearStickerRemotePatchTimers
  pullStickersSinceWatermark = mod.pullStickersSinceWatermark
  initStickersSyncLifecycle = mod.initStickersSyncLifecycle
})

afterEach(() => {
  vi.useRealTimers()
})

describe('stickersRemoteSync', () => {
  it('pushNewStickerToServer: offline enqueues create, no API', async () => {
    mockSync.networkOnline = false
    const s = baseSticker()
    await pushNewStickerToServer(s)
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth)).toHaveLength(1)
    expect(loadOutboxOps(mockAuth)[0].type).toBe('create')
    expect(stickersApiMocks.apiStickerCreate).not.toHaveBeenCalled()
  })

  it('pushNewStickerToServer: online calls API and updates sticker', async () => {
    const s = baseSticker({ text: 'A' })
    await pushNewStickerToServer(s)
    expect(stickersApiMocks.apiStickerCreate).toHaveBeenCalledTimes(1)
    expect(s.updated_at).toBe('2025-07-01T00:00:00.000Z')
    expect(s.text).toBe('srv')
    expect(s.id).toBe(1)
  })

  it('pushNewStickerToServer: server display_id becomes local id', async () => {
    stickersApiMocks.apiStickerCreate.mockResolvedValueOnce({
      res: { ok: true, status: 201 },
      sticker: {
        uuid: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee',
        display_id: 42,
        updated_at: '2025-07-01T00:00:00.000Z',
        text: 'srv',
        folded: false
      }
    })
    const s = baseSticker({ id: 99, text: 'A' })
    await pushNewStickerToServer(s)
    expect(s.id).toBe(42)
  })

  it('pushNewStickerToServer: API error enqueues and 500 sets sync error', async () => {
    stickersApiMocks.apiStickerCreate.mockResolvedValueOnce({
      res: { ok: false, status: 503 },
      sticker: null
    })
    const s = baseSticker()
    await pushNewStickerToServer(s)
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth).some((o) => o.type === 'create')).toBe(true)
    expect(mockSync.setError).toHaveBeenCalled()
  })

  it('deleteStickerOnServer: offline enqueues delete', async () => {
    mockSync.networkOnline = false
    const token = baseSticker().token
    await deleteStickerOnServer(token)
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth).some((o) => o.type === 'delete' && o.token === token)).toBe(true)
    expect(stickersApiMocks.apiStickerDelete).not.toHaveBeenCalled()
  })

  it('deleteStickerOnServer: 404 does not enqueue', async () => {
    stickersApiMocks.apiStickerDelete.mockResolvedValueOnce({ ok: false, status: 404 })
    const token = baseSticker().token
    await deleteStickerOnServer(token)
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth)).toHaveLength(0)
  })

  it('scheduleStickerRemotePatch: debounced flush calls PATCH when online', async () => {
    vi.useFakeTimers()
    const token = baseSticker().token
    mockMain.stickers.push(baseSticker())
    await import('@/services/stickersOutbox')
    scheduleStickerRemotePatch(token)
    await vi.advanceTimersByTimeAsync(500)
    expect(stickersApiMocks.apiStickerPatch).toHaveBeenCalled()
    clearStickerRemotePatchTimers()
  })

  it('PATCH success keeps local x,y,w,h,z (server echo must not cause layout jump)', async () => {
    const s = baseSticker({
      x: 10.3,
      y: 20.7,
      w: 120,
      h: 80,
      z: 3,
      text: 'keep-me'
    })
    mockMain.stickers.push(s)
    stickersApiMocks.apiStickerPatch.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      sticker: {
        display_id: 1,
        updated_at: '2025-07-01T00:00:00.000Z',
        text: 'from-api',
        folded: false,
        x: 999,
        y: 888,
        w: 111,
        h: 222,
        z: 0
      }
    })

    const { flushStickerRemotePatchNow } = await import('@/services/stickersRemoteSync')
    flushStickerRemotePatchNow(s.token)

    await vi.waitFor(() => {
      expect(stickersApiMocks.apiStickerPatch).toHaveBeenCalled()
    })

    expect(s.text).toBe('from-api')
    expect(s.x).toBe(10.3)
    expect(s.y).toBe(20.7)
    expect(s.w).toBe(120)
    expect(s.h).toBe(80)
    expect(s.z).toBe(3)
    clearStickerRemotePatchTimers()
  })

  it('scheduleStickerRemotePatch: offline enqueues update', async () => {
    vi.useFakeTimers()
    mockSync.networkOnline = false
    const token = baseSticker().token
    mockMain.stickers.push(baseSticker())
    scheduleStickerRemotePatch(token)
    await vi.advanceTimersByTimeAsync(500)
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth).some((o) => o.type === 'update')).toBe(true)
    expect(stickersApiMocks.apiStickerPatch).not.toHaveBeenCalled()
    clearStickerRemotePatchTimers()
  })

  it('runAuthenticatedBoardSync: list failure sets error', async () => {
    stickersApiMocks.apiStickersList.mockResolvedValueOnce({
      res: { ok: false, status: 500 },
      data: null
    })
    await runAuthenticatedBoardSync()
    expect(mockSync.setError).toHaveBeenCalled()
  })

  it('runAuthenticatedBoardSync: processes outbox create then full list', async () => {
    mockSync.networkOnline = true
    const token = 'bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee'
    const { enqueueOutboxCreate } = await import('@/services/stickersOutbox')
    enqueueOutboxCreate(mockAuth, {
      uuid: token,
      text: 'q',
      folded: false,
      bc: '#fff',
      font: 'Inter, sans-serif',
      fs: 14,
      tc: '#000'
    })

    stickersApiMocks.apiStickerCreate.mockResolvedValueOnce({
      res: { ok: true, status: 201 },
      sticker: {
        uuid: token,
        display_id: 1,
        updated_at: '2025-08-01T00:00:00.000Z',
        text: 'q',
        folded: false
      }
    })

    mockMain.stickers.push(
      baseSticker({
        token,
        text: 'q',
        updated_at: '2025-01-01T00:00:00.000Z'
      })
    )

    await runAuthenticatedBoardSync()

    expect(stickersApiMocks.apiStickerCreate).toHaveBeenCalled()
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth)).toHaveLength(0)
  })

  it('pullStickersSinceWatermark: adds new remote sticker', async () => {
    localStorage.setItem('stycky-pull-watermark-user-42', '2025-01-01T00:00:00.000Z')
    stickersApiMocks.apiStickersList.mockImplementation(async (params) => {
      if (params?.since) {
        return {
          res: { ok: true, status: 200 },
          data: {
            stickers: [
              {
                uuid: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
                display_id: 11,
                updated_at: '2025-02-01T00:00:00.000Z',
                text: 'from server',
                folded: false
              }
            ]
          }
        }
      }
      return { res: { ok: true, status: 200 }, data: { stickers: [] } }
    })

    await pullStickersSinceWatermark()

    expect(mockMain.stickers.some((s) => s.token === 'cccccccc-cccc-4ccc-cccc-cccccccccccc')).toBe(
      true
    )
    const added = mockMain.stickers.find((s) => s.token === 'cccccccc-cccc-4ccc-cccc-cccccccccccc')
    expect(added.text).toBe('from server')
    expect(added.id).toBe(11)
  })

  it('pullStickersSinceWatermark: local newer triggers PATCH to server', async () => {
    const token = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'
    mockMain.stickers.push(
      baseSticker({
        token,
        text: 'local wins',
        updated_at: '2025-12-01T00:00:00.000Z'
      })
    )
    localStorage.setItem('stycky-pull-watermark-user-42', '2020-01-01T00:00:00.000Z')

    stickersApiMocks.apiStickersList.mockResolvedValue({
      res: { ok: true, status: 200 },
      data: {
        stickers: [
          {
            uuid: token,
            updated_at: '2025-01-01T00:00:00.000Z',
            text: 'old',
            folded: false
          }
        ]
      }
    })

    await pullStickersSinceWatermark()

    expect(stickersApiMocks.apiStickerPatch).toHaveBeenCalledWith(token, expect.any(Object))
  })

  it('pullStickersSinceWatermark: no API when board layout gesture active (variant B)', async () => {
    localStorage.setItem('stycky-pull-watermark-user-42', '2025-01-01T00:00:00.000Z')
    mockSync.setBoardLayoutGestureToken('aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee')
    stickersApiMocks.apiStickersList.mockClear()
    stickersApiMocks.apiStickersRemovedSince.mockClear()

    await pullStickersSinceWatermark()

    expect(stickersApiMocks.apiStickersList).not.toHaveBeenCalled()
    expect(stickersApiMocks.apiStickersRemovedSince).not.toHaveBeenCalled()
  })

  it('pullStickersSinceWatermark: aborts after API if gesture starts before merge (during await gap)', async () => {
    localStorage.setItem('stycky-pull-watermark-user-42', '2025-01-01T00:00:00.000Z')
    const token = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee'
    mockMain.stickers.push(
      baseSticker({
        token,
        text: 'local only',
        updated_at: '2025-06-01T00:00:00.000Z'
      })
    )

    stickersApiMocks.apiStickersList.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      data: {
        stickers: [
          {
            uuid: token,
            updated_at: '2025-07-01T00:00:00.000Z',
            text: 'from server',
            folded: false
          }
        ]
      }
    })

    stickersApiMocks.apiStickersRemovedSince.mockImplementationOnce(async () => {
      mockSync.setBoardLayoutGestureToken(token)
      return {
        res: { ok: true, status: 200 },
        data: { removed: [] }
      }
    })

    stickersApiMocks.apiStickerPatch.mockClear()

    await pullStickersSinceWatermark()

    expect(stickersApiMocks.apiStickersList).toHaveBeenCalled()
    expect(stickersApiMocks.apiStickersRemovedSince).toHaveBeenCalled()
    expect(mockMain.stickers.find((s) => s.token === token).text).toBe('local only')
    expect(stickersApiMocks.apiStickerPatch).not.toHaveBeenCalled()
  })

  it('pullStickersSinceWatermark: empty board resets nextId after removals (no stale counter)', async () => {
    localStorage.setItem('stycky-pull-watermark-user-42', '2025-01-01T00:00:00.000Z')
    mockMain.nextId = 50
    mockMain.stickers.push(
      baseSticker({
        id: 30,
        token: '11111111-1111-4111-8111-111111111111'
      })
    )

    stickersApiMocks.apiStickersList.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      data: { stickers: [] }
    })
    stickersApiMocks.apiStickersRemovedSince.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      data: {
        removed: [
          {
            uuid: '11111111-1111-4111-8111-111111111111',
            deleted_at: '2025-02-01T00:00:00.000Z'
          }
        ]
      }
    })

    await pullStickersSinceWatermark()

    expect(mockMain.stickers).toHaveLength(0)
    expect(mockMain.nextId).toBe(1)
  })

  it('pullStickersSinceWatermark: no content merge while board text edit token set', async () => {
    localStorage.setItem('stycky-pull-watermark-user-42', '2025-01-01T00:00:00.000Z')
    const token = 'ffffffff-ffff-4fff-ffff-ffffffffffff'
    mockMain.stickers.push(
      baseSticker({
        token,
        text: 'user typing',
        updated_at: '2025-01-01T00:00:00.000Z'
      })
    )
    mockSync.setBoardTextEditToken(token)

    stickersApiMocks.apiStickersList.mockResolvedValueOnce({
      res: { ok: true, status: 200 },
      data: {
        stickers: [
          {
            uuid: token,
            updated_at: '2025-12-01T00:00:00.000Z',
            text: 'from server newer',
            folded: false
          }
        ]
      }
    })

    stickersApiMocks.apiStickerPatch.mockClear()

    await pullStickersSinceWatermark()

    expect(mockMain.stickers.find((s) => s.token === token).text).toBe('user typing')
    expect(stickersApiMocks.apiStickerPatch).not.toHaveBeenCalled()
  })

  it('guest: pushNewStickerToServer is no-op', async () => {
    mockAuth.isAuthenticated = false
    mockAuth.user = null
    const s = baseSticker()
    await pushNewStickerToServer(s)
    expect(stickersApiMocks.apiStickerCreate).not.toHaveBeenCalled()
    const { loadOutboxOps } = await import('@/services/stickersOutbox')
    expect(loadOutboxOps(mockAuth)).toHaveLength(0)
  })

  describe('initStickersSyncLifecycle', () => {
    beforeEach(() => {
      vi.stubGlobal('window', {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
      vi.stubGlobal('document', {
        addEventListener: vi.fn(),
        visibilityState: 'visible'
      })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('registers setInterval with STICKER.REMOTE_PULL_INTERVAL_MS', async () => {
      const { STICKER } = await import('@/constants/sticker.constants')
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval').mockImplementation(() => 99)

      initStickersSyncLifecycle()

      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        STICKER.REMOTE_PULL_INTERVAL_MS
      )
      expect(STICKER.REMOTE_PULL_INTERVAL_MS).toBe(3_000)
    })

    it('second init clears previous interval id', async () => {
      vi.spyOn(globalThis, 'setInterval').mockReturnValue(111)
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      initStickersSyncLifecycle()
      initStickersSyncLifecycle()

      expect(clearIntervalSpy).toHaveBeenCalledWith(111)
    })
  })
})
