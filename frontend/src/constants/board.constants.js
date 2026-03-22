/** Запас справа/снизу за последним стикером (мобильное полотно). */
export const BOARD_EDGE_PADDING = 72

/** Панорама и лимиты координат только при max-width ≤ этого значения. */
export const BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX = 768

/** Десктоп: правый/нижний край стикера (px). */
export const BOARD_MAX_STICKER_RIGHT = 2560
export const BOARD_MAX_STICKER_BOTTOM = 1920

/** Мобилка: размеры зоны размещения стикеров (внутри полотна, со всех сторон BOARD_EDGE_PADDING). */
export const BOARD_MAX_STICKER_RIGHT_MOBILE = 1280
export const BOARD_MAX_STICKER_BOTTOM_MOBILE = 720

/** Панорамируемое полотно: зона стикеров + отступы со всех четырёх сторон. */
export const BOARD_MOBILE_CANVAS_WIDTH_PX =
  BOARD_MAX_STICKER_RIGHT_MOBILE + 2 * BOARD_EDGE_PADDING
export const BOARD_MOBILE_CANVAS_HEIGHT_PX =
  BOARD_MAX_STICKER_BOTTOM_MOBILE + 2 * BOARD_EDGE_PADDING

export function getBoardStickerMaxExtents() {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(`(max-width: ${BOARD_MOBILE_LAYOUT_MAX_WIDTH_PX}px)`).matches
  ) {
    // Координаты в «логической» зоне 0…1280 × 0…720; отступ полотна только в BoardApp (обёртка).
    return {
      right: BOARD_MAX_STICKER_RIGHT_MOBILE,
      bottom: BOARD_MAX_STICKER_BOTTOM_MOBILE,
      minX: 0,
      minY: 0
    }
  }
  return {
    right: BOARD_MAX_STICKER_RIGHT,
    bottom: BOARD_MAX_STICKER_BOTTOM,
    minX: 0,
    minY: 0
  }
}
