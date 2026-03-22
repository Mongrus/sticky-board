import { ref } from 'vue'

/** Десктоп: правый/нижний край зоны стикеров = размер .board (client), пока BoardApp не измерил — запас как раньше. */
const DEFAULT_W = 2560
const DEFAULT_H = 1920

export const boardPlayableClientSize = ref({
  width: DEFAULT_W,
  height: DEFAULT_H
})

export function setBoardPlayableClientSize(width, height) {
  boardPlayableClientSize.value = {
    width: Math.max(0, Math.round(Number(width)) || 0),
    height: Math.max(0, Math.round(Number(height)) || 0)
  }
}
