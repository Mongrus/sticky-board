<script setup>
import { useMainStore } from '@/stores/main.store';

    const store = useMainStore();

    defineProps({
        sticker: Object
    })


function moveSticker(e, id) {

  const sticker = store.stickers.find(s => s.id === id)

    const offsetX = e.clientX - sticker.x
    const offsetY = e.clientY - sticker.y

  const move = (ev) => {
    store.setPositionSticker(
      id,
      ev.clientX - offsetX,
      ev.clientY - offsetY
    )
  }

  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }

  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

</script>

<template>
    <textarea 
    class="sticker"
    :key="sticker.id" 
    :style="{
        backgroundColor: sticker.bc,
        fontSize: sticker.fs + 'px',
        width: sticker.w + 'px', 
        height: sticker.h + 'px',
        left: sticker.x + 'px',
        top: sticker.y + 'px'
        }"
        @mousedown="(e) => moveSticker(e, sticker.id)"
        >{{ sticker.text }}</textarea>
</template>

<style lang="sass" scoped>

.sticker
    position: absolute
    padding: 10px
    user-select: none
    cursor: grab
    color: white

</style>