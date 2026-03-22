export const STICKER = {
  MIN_WIDTH: 100,
  MIN_HEIGHT: 50,
  /** Размер шрифта стикера (px); совпадает с валидацией API `fs`. */
  FONT_SIZE_MIN: 1,
  FONT_SIZE_MAX: 120,
  TEXT_SAVE_DEBOUNCE_MS: 350,
  REMOTE_PATCH_DEBOUNCE_MS: 400,
  /** Инкрементальный pull с сервера (видимая вкладка, залогинен, онлайн). */
  REMOTE_PULL_INTERVAL_MS: 3_000,
  SYNC_INCLUDE_LAYOUT: true,
  /** Поверх остальных стикеров во время drag/resize (z в сторе — только после pointerup). */
  DRAG_GESTURE_Z_INDEX: 2_147_483_000
}

/** Целое в [FONT_SIZE_MIN, FONT_SIZE_MAX] для API и инпутов; невалидное значение → defaultFs. */
export function clampStickerFontSize(value, defaultFs = 14) {
  const n = Math.round(Number(value))
  if (Number.isNaN(n)) return defaultFs
  return Math.max(STICKER.FONT_SIZE_MIN, Math.min(STICKER.FONT_SIZE_MAX, n))
}

export const STICKER_COLORS = [
    { label: 'Мягкий желтый', value: '#FFF9C4' },
    { label: 'Нежный зеленый', value: '#E8F5E9' },
    { label: 'Светлый голубой', value: '#E3F2FD' },
    { label: 'Мягкий фиолетовый', value: '#F3E5F5' },
    { label: 'Нежный розовый', value: '#FCE4EC' },
    { label: 'Светлый оранжевый', value: '#FFF3E0' },

    { label: 'Пастельный мятный', value: '#E0F2F1' },
    { label: 'Нежный лавандовый', value: '#EDE7F6' },
    { label: 'Светлый персиковый', value: '#FFE0B2' },
    { label: 'Пастельный лимонный', value: '#FFFDE7' },
    { label: 'Нежный небесный', value: '#E1F5FE' },
    { label: 'Мягкий коралловый', value: '#FFEBEE' },

    { label: 'Светлый шалфейный', value: '#F1F8E9' },
    { label: 'Пастельный бирюзовый', value: '#E0F7FA' },
    { label: 'Нежный кремовый', value: '#FFF8E1' },
    { label: 'Мягкий сиреневый', value: '#F8BBD0' },
    { label: 'Светлый абрикосовый', value: '#FFE4C4' },
    { label: 'Пастельный голубой', value: '#E6F0FF' },

    { label: 'Нежный песочный', value: '#F5F5DC' },
    { label: 'Светлый пудровый', value: '#FDEDEC' }
]

export const STICKER_FONTS = [
    { label: 'Andika', value: 'Andika, sans-serif' },
    { label: 'Inter', value: 'Inter, sans-serif' },
    { label: 'Roboto', value: 'Roboto, sans-serif' },
    { label: 'Open Sans', value: '"Open Sans", sans-serif' },
    { label: 'Montserrat', value: 'Montserrat, sans-serif' },
    { label: 'Nunito', value: 'Nunito, sans-serif' },
    { label: 'Lora', value: 'Lora, serif' },
    { label: 'PT Serif', value: '"PT Serif", serif' },
    { label: 'Playfair Display', value: '"Playfair Display", serif' },
    { label: 'Fira Code', value: '"Fira Code", monospace' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
    { label: 'Comfortaa', value: 'Comfortaa, cursive' },
    { label: 'Pacifico', value: 'Pacifico, cursive' },
    { label: 'Caveat', value: 'Caveat, cursive' },
    { label: 'Marck Script', value: '"Marck Script", cursive' },
    { label: 'Patrick Hand', value: '"Patrick Hand", cursive' },
    { label: 'Shadows Into Light', value: '"Shadows Into Light", cursive' }
]