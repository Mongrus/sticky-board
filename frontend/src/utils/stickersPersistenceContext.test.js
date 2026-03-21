import { describe, it, expect } from 'vitest'
import { STICKERS_STORE_GUEST_KEY } from '@/constants/storage.constants'
import { isLoggingOutToGuest } from './stickersPersistenceContext.js'

describe('stickersPersistenceContext', () => {
  it('true when switching from user key to guest', () => {
    expect(
      isLoggingOutToGuest(STICKERS_STORE_GUEST_KEY, 'stickers-store-user-7', STICKERS_STORE_GUEST_KEY)
    ).toBe(true)
  })

  it('false when staying guest', () => {
    expect(isLoggingOutToGuest(STICKERS_STORE_GUEST_KEY, STICKERS_STORE_GUEST_KEY)).toBe(false)
  })

  it('false when logging in (guest -> user)', () => {
    expect(isLoggingOutToGuest('stickers-store-user-1', STICKERS_STORE_GUEST_KEY)).toBe(false)
  })
})
