<script setup>
import Sticker from './components/Sticker.vue';
import { useMainStore } from './stores/main.store';

const store = useMainStore();

</script>

<template>
  <header>
    <button @click="store.createSticker(
        store.stickers.length, 
        '', // Текст
        false, // Свернут ?
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, // по X
        !store.stickers.length ? 20 : store.stickers.length * 10 + 20, // по Y
        store.settings.width, // Ширина
        store.settings.height, // Высота
        store.settings.backgroundColor, // Цвет фона
        store.settings.fontSize, // Размер шрифта
        Math.max(...store.stickers.map(s => s.z), 0) // z-index
        )">+</button>
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
