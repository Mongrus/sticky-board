import { describe, it, expect } from 'vitest'
import { STICKER, clampStickerFontSize } from './sticker.constants.js'

describe('sticker.constants STICKER sync', () => {
  it('REMOTE_PULL_INTERVAL_MS matches sticker.constants value', () => {
    expect(STICKER.REMOTE_PULL_INTERVAL_MS).toBe(3_000)
  })
})

describe('clampStickerFontSize', () => {
  it('clamps to FONT_SIZE_MIN and FONT_SIZE_MAX', () => {
    expect(clampStickerFontSize(0)).toBe(1)
    expect(clampStickerFontSize(-5)).toBe(1)
    expect(clampStickerFontSize(200)).toBe(120)
    expect(clampStickerFontSize(1)).toBe(1)
    expect(clampStickerFontSize(120)).toBe(120)
  })

  it('rounds and uses default for NaN', () => {
    expect(clampStickerFontSize(14.7)).toBe(15)
    expect(clampStickerFontSize(NaN)).toBe(14)
    expect(clampStickerFontSize(undefined)).toBe(14)
    expect(clampStickerFontSize('x', 20)).toBe(20)
  })
})
