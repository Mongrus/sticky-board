export function parseStickerUpdatedAtMs(iso) {
  if (iso == null || iso === '') return 0
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

export function mergeGuestBoardLww(userStickers, guestStickers) {
  if (!Array.isArray(guestStickers) || guestStickers.length === 0) {
    return null
  }

  const guestByToken = new Map()
  for (const s of guestStickers) {
    if (s?.token) guestByToken.set(s.token, { ...s })
  }

  const usedGuestTokens = new Set()
  const merged = []

  for (const s of userStickers) {
    if (!s?.token) {
      merged.push({ ...s })
      continue
    }
    const g = guestByToken.get(s.token)
    if (!g) {
      merged.push({ ...s })
      continue
    }
    usedGuestTokens.add(s.token)
    const pickGuest = parseStickerUpdatedAtMs(g.updated_at) > parseStickerUpdatedAtMs(s.updated_at)
    merged.push(pickGuest ? { ...g } : { ...s })
  }

  for (const g of guestStickers) {
    if (!g?.token || usedGuestTokens.has(g.token)) continue
    merged.push({ ...g })
    usedGuestTokens.add(g.token)
  }

  const nextId = merged.reduce((m, s) => Math.max(m, s.id || 0), 0) + 1
  return { stickers: merged, nextId }
}
