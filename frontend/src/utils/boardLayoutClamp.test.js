import { describe, it, expect, vi, afterEach } from 'vitest'
import { clampStickerLayoutToBoardBounds } from './boardLayoutClamp'
import {
  BOARD_MAX_STICKER_RIGHT,
  BOARD_MAX_STICKER_BOTTOM,
  BOARD_MAX_STICKER_RIGHT_MOBILE,
  BOARD_MAX_STICKER_BOTTOM_MOBILE
} from '@/constants/board.constants'
import { STICKER } from '@/constants/sticker.constants'

describe('clampStickerLayoutToBoardBounds', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('clamps to desktop max when not mobile', () => {
    const s = { x: 9000, y: 8000, w: 200, h: 120 }
    clampStickerLayoutToBoardBounds(s)
    expect(s.x + s.w).toBeLessThanOrEqual(BOARD_MAX_STICKER_RIGHT)
    expect(s.y + s.h).toBeLessThanOrEqual(BOARD_MAX_STICKER_BOTTOM)
  })

  it('enforces min width and height', () => {
    const s = { x: 0, y: 0, w: 10, h: 10 }
    clampStickerLayoutToBoardBounds(s)
    expect(s.w).toBe(STICKER.MIN_WIDTH)
    expect(s.h).toBe(STICKER.MIN_HEIGHT)
  })

  it('clamps to mobile max extents when matchMedia is mobile', () => {
    vi.stubGlobal('window', {
      matchMedia: vi.fn(() => ({
        matches: true,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
    try {
      const s = { x: 5000, y: 4000, w: 200, h: 120 }
      clampStickerLayoutToBoardBounds(s)
      expect(s.x + s.w).toBeLessThanOrEqual(BOARD_MAX_STICKER_RIGHT_MOBILE)
      expect(s.y + s.h).toBeLessThanOrEqual(BOARD_MAX_STICKER_BOTTOM_MOBILE)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
