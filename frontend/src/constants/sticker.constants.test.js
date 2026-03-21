import { describe, it, expect } from 'vitest'
import { STICKER } from './sticker.constants.js'

describe('sticker.constants STICKER sync', () => {
  it('REMOTE_PULL_INTERVAL_MS is 10 seconds for multi-device incremental pull', () => {
    expect(STICKER.REMOTE_PULL_INTERVAL_MS).toBe(10_000)
  })
})
