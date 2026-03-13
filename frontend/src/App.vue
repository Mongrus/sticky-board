<script setup>
import Sticker from './components/Sticker.vue';
import { STICKER_COLORS } from './constants/sticker.constants';
import { useMainStore } from './stores/main.store';

const store = useMainStore();

</script>

<template>
  <header>
    <button @click="store.createSticker(
        store.nextId, 
        '', // Текст
        false, // Свернут ?
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, // по X
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, // по Y
        store.settings.width, // Ширина
        store.settings.height, // Высота
        STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)].value, // Цвет фона
        store.settings.fontSize, // Размер шрифта
        Math.max(...store.stickers.map(s => s.z), 0) // z-index
        )">+</button>
    <button @click="store.clearBoard()">Очистить</button>
  </header>
  <main>
    <div>

    </div>
    <div class="board">
      <Sticker v-for="sticker in store.stickers" :sticker="sticker" :key="sticker.id"/>
    </div>
  </main>
  <footer>

  </footer>
</template>

<style lang="sass" scoped>

.board
    position: relative

</style>
