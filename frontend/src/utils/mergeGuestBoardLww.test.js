import { describe, it, expect } from 'vitest'
import { mergeGuestBoardLww, parseStickerUpdatedAtMs } from './mergeGuestBoardLww.js'

const T1 = '2025-01-01T10:00:00.000Z'
const T2 = '2025-01-02T10:00:00.000Z'
const T3 = '2025-01-03T10:00:00.000Z'

describe('parseStickerUpdatedAtMs', () => {
  it('returns 0 for empty', () => {
    expect(parseStickerUpdatedAtMs('')).toBe(0)
    expect(parseStickerUpdatedAtMs(null)).toBe(0)
  })
  it('parses ISO', () => {
    expect(parseStickerUpdatedAtMs(T1)).toBe(Date.parse(T1))
  })
})

describe('mergeGuestBoardLww', () => {
  it('returns null when guest empty', () => {
    expect(mergeGuestBoardLww([], [])).toBe(null)
    expect(mergeGuestBoardLww([{ id: 1, token: 'a' }], [])).toBe(null)
  })

  it('guest-only: copies all guest stickers when user empty', () => {
    const guest = [
      { id: 1, token: 'u1', text: 'g', updated_at: T1 },
      { id: 2, token: 'u2', text: 'h', updated_at: T1 }
    ]
    const r = mergeGuestBoardLww([], guest)
    expect(r.stickers).toHaveLength(2)
    expect(r.stickers[0].text).toBe('g')
    expect(r.nextId).toBe(3)
  })

  it('same token: guest newer wins', () => {
    const user = [{ id: 1, token: 'x', text: 'old', updated_at: T1 }]
    const guest = [{ id: 1, token: 'x', text: 'new', updated_at: T2 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers[0].text).toBe('new')
  })

  it('same token: user newer wins', () => {
    const user = [{ id: 1, token: 'x', text: 'server', updated_at: T3 }]
    const guest = [{ id: 1, token: 'x', text: 'guest', updated_at: T2 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers[0].text).toBe('server')
  })

  it('same token: equal updated_at keeps user', () => {
    const user = [{ id: 1, token: 'x', text: 'user', updated_at: T2 }]
    const guest = [{ id: 1, token: 'x', text: 'guest', updated_at: T2 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers[0].text).toBe('user')
  })

  it('user sticker without token is preserved', () => {
    const user = [{ id: 9, text: 'no token', updated_at: T1 }]
    const guest = [{ id: 1, token: 'x', text: 'g', updated_at: T1 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers).toHaveLength(2)
    expect(r.stickers[0].text).toBe('no token')
    expect(r.stickers[1].token).toBe('x')
  })

  it('user-only token plus guest-only token: union', () => {
    const user = [{ id: 1, token: 'a', text: 'A', updated_at: T1 }]
    const guest = [{ id: 2, token: 'b', text: 'B', updated_at: T1 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers).toHaveLength(2)
    const texts = r.stickers.map((s) => s.text).sort()
    expect(texts).toEqual(['A', 'B'])
  })

  it('clones objects (shallow)', () => {
    const user = [{ id: 1, token: 'x', text: 'u', updated_at: T3 }]
    const guest = [{ id: 1, token: 'x', text: 'g', updated_at: T1 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.stickers[0]).not.toBe(user[0])
    r.stickers[0].text = 'mutated'
    expect(user[0].text).toBe('u')
  })

  it('nextId is max id + 1', () => {
    const user = [{ id: 5, token: 'a', updated_at: T1 }]
    const guest = [{ id: 2, token: 'b', updated_at: T1 }]
    const r = mergeGuestBoardLww(user, guest)
    expect(r.nextId).toBe(6)
  })
})
