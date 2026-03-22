import { STICKER } from '@/constants/sticker.constants'
import { getBoardStickerMaxExtents } from '@/constants/board.constants'

export function clampStickerLayoutToBoardBounds(sticker) {
  if (!sticker) return
  const {
    right: maxRight,
    bottom: maxBottom,
    minX = 0,
    minY = 0
  } = getBoardStickerMaxExtents()
  const w = Math.max(STICKER.MIN_WIDTH, Math.round(Number(sticker.w)) || STICKER.MIN_WIDTH)
  const h = Math.max(STICKER.MIN_HEIGHT, Math.round(Number(sticker.h)) || STICKER.MIN_HEIGHT)
  const maxX = Math.max(minX, maxRight - w)
  const maxY = Math.max(minY, maxBottom - h)
  sticker.w = w
  sticker.h = h
  sticker.x = Math.max(minX, Math.min(maxX, Math.round(Number(sticker.x)) || 0))
  sticker.y = Math.max(minY, Math.min(maxY, Math.round(Number(sticker.y)) || 0))
}
