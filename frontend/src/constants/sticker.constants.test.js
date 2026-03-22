import { describe, it, expect } from 'vitest'
import { STICKER } from './sticker.constants.js'

describe('sticker.constants STICKER sync', () => {
  it('REMOTE_PULL_INTERVAL_MS matches sticker.constants value', () => {
    expect(STICKER.REMOTE_PULL_INTERVAL_MS).toBe(3_000)
  })
})
